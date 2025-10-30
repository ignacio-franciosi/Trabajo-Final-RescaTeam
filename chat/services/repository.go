package services

import (
	"chat/model"
	"context"
	"errors"
	"sort"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ---------- Interface ----------
type Repository interface {
	FindOrCreateChat(ctx context.Context, me, other, postID string) (model.Chat, error)
	GetChat(ctx context.Context, chatID string) (model.Chat, error)
	ListChats(ctx context.Context, me string, limit int64) ([]model.Chat, error)
	SaveMessage(ctx context.Context, m model.Message) (model.Message, error)
	ListMessages(ctx context.Context, chatID string, limit int64) ([]model.Message, error)
	MarkRead(ctx context.Context, chatID, userID string) error

	// Push subscription methods
	SaveSubscription(ctx context.Context, sub model.PushSubscription) error
	ListSubscriptions(ctx context.Context, userID string) ([]model.PushSubscription, error)
	DeleteSubscription(ctx context.Context, endpoint string) error
}

// ---------- Implementación Mongo ----------
type MongoRepository struct {
	db          *mongo.Database
	chatsCol    *mongo.Collection
	messagesCol *mongo.Collection
	pushCol     *mongo.Collection
}

func NewMongoRepository(db *mongo.Database) *MongoRepository {
	return &MongoRepository{
		db:          db,
		chatsCol:    db.Collection("chats"),
		messagesCol: db.Collection("messages"),
		pushCol:     db.Collection("push_subscriptions"),
	}
}

func sortedPair(a, b string) [2]string {
	p := []string{a, b}
	sort.Strings(p)
	return [2]string{p[0], p[1]}
}

func pairKey(parts [2]string) string {
	return parts[0] + "#" + parts[1]
}

// helper para detectar duplicate-key de Mongo
func isMongoDuplicateKeyErr(err error) bool {
	if err == nil {
		return false
	}
	// mongo.WriteException
	if we, ok := err.(mongo.WriteException); ok {
		for _, e := range we.WriteErrors {
			if e.Code == 11000 {
				return true
			}
		}
	}
	// mongo.CommandError
	var cmdErr mongo.CommandError
	if errors.As(err, &cmdErr) && cmdErr.Code == 11000 {
		return true
	}
	// fallback por contenido
	l := strings.ToLower(err.Error())
	return strings.Contains(l, "e11000") || strings.Contains(l, "duplicate key")
}

// 1) Buscar chat por (participantsKey + postID) o crearlo (upsert atómico)
func (r *MongoRepository) FindOrCreateChat(ctx context.Context, me, other, postID string) (model.Chat, error) {
	parts := sortedPair(me, other)
	key := pairKey(parts)

	filter := bson.M{
		"participantsKey": key,
		"postId":          postID,
	}

	now := time.Now()
	newID := primitive.NewObjectID()

	update := bson.M{
		"$setOnInsert": bson.M{
			"_id":             newID,
			"participants":    parts,
			"participantsKey": key,
			"postId":          postID,
			"lastUpdate":      now,
			"lastMessage":     "",
			"lastSenderId":    "",
		},
	}

	opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)

	var chat model.Chat
	err := r.chatsCol.FindOneAndUpdate(ctx, filter, update, opts).Decode(&chat)
	if err == nil {
		return chat, nil
	}

	// Carreras: si otro proceso insertó justo antes, recuperamos el chat exacto
	if isMongoDuplicateKeyErr(err) {
		if findErr := r.chatsCol.FindOne(ctx, filter).Decode(&chat); findErr == nil {
			return chat, nil
		}
		return model.Chat{}, err
	}

	if err == mongo.ErrNoDocuments {
		return model.Chat{}, errors.New("no se pudo crear/recuperar chat")
	}
	return model.Chat{}, err
}

// 2) Traer un chat por su _id
func (r *MongoRepository) GetChat(ctx context.Context, chatID string) (model.Chat, error) {
	objID, err := primitive.ObjectIDFromHex(chatID)
	if err != nil {
		return model.Chat{}, errors.New("chatId inválido")
	}
	var chat model.Chat
	if err := r.chatsCol.FindOne(ctx, bson.M{"_id": objID}).Decode(&chat); err != nil {
		return model.Chat{}, err
	}
	return chat, nil
}

// 3) Listar mis chats ordenados por última actualización
func (r *MongoRepository) ListChats(ctx context.Context, me string, limit int64) ([]model.Chat, error) {
	opts := options.Find().
		SetSort(bson.D{{Key: "lastUpdate", Value: -1}})
	if limit > 0 {
		opts.SetLimit(limit)
	}

	// participants contiene 'me'
	cur, err := r.chatsCol.Find(ctx, bson.M{"participants": me}, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var chats []model.Chat
	if err := cur.All(ctx, &chats); err != nil {
		return nil, err
	}
	return chats, nil
}

// 4) Guardar mensaje y actualizar metadatos del chat
func (r *MongoRepository) SaveMessage(ctx context.Context, m model.Message) (model.Message, error) {
	if m.ID.IsZero() {
		m.ID = primitive.NewObjectID()
	}
	if m.Timestamp.IsZero() {
		m.Timestamp = time.Now()
	}

	if _, err := r.messagesCol.InsertOne(ctx, m); err != nil {
		return model.Message{}, err
	}

	_, _ = r.chatsCol.UpdateByID(ctx, m.ChatID, bson.M{
		"$set": bson.M{
			"lastUpdate":   m.Timestamp,
			"lastMessage":  m.Content,
			"lastSenderId": m.SenderID,
		},
	})

	return m, nil
}

// 5) Listar mensajes (orden cronológico)
func (r *MongoRepository) ListMessages(ctx context.Context, chatID string, limit int64) ([]model.Message, error) {
	objID, err := primitive.ObjectIDFromHex(chatID)
	if err != nil {
		return nil, errors.New("chatId inválido")
	}

	opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}})
	if limit > 0 {
		opts.SetLimit(limit)
	}

	cur, err := r.messagesCol.Find(ctx, bson.M{"chatId": objID}, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var msgs []model.Message
	if err := cur.All(ctx, &msgs); err != nil {
		return nil, err
	}

	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs, nil
}

// 6) Marcar leídos
func (r *MongoRepository) MarkRead(ctx context.Context, chatID, userID string) error {
	objID, err := primitive.ObjectIDFromHex(chatID)
	if err != nil {
		return errors.New("chatId inválido")
	}

	_, err = r.messagesCol.UpdateMany(
		ctx,
		bson.M{
			"chatId":   objID,
			"senderId": bson.M{"$ne": userID},
			"viewed":   false,
		},
		bson.M{"$set": bson.M{"viewed": true}},
	)
	return err
}

/* -------- Push subscriptions -------- */

func (r *MongoRepository) SaveSubscription(ctx context.Context, sub model.PushSubscription) error {
	if sub.ID.IsZero() {
		sub.ID = primitive.NewObjectID()
	}
	if sub.CreatedAt.IsZero() {
		sub.CreatedAt = time.Now()
	}
	_, err := r.pushCol.InsertOne(ctx, sub)
	if we, ok := err.(mongo.WriteException); ok {
		for _, e := range we.WriteErrors {
			if e.Code == 11000 {
				return nil
			}
		}
	}
	return err
}

func (r *MongoRepository) ListSubscriptions(ctx context.Context, userID string) ([]model.PushSubscription, error) {
	cur, err := r.pushCol.Find(ctx, bson.M{"userId": userID})
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var subs []model.PushSubscription
	if err := cur.All(ctx, &subs); err != nil {
		return nil, err
	}
	return subs, nil
}

func (r *MongoRepository) DeleteSubscription(ctx context.Context, endpoint string) error {
	_, err := r.pushCol.DeleteOne(ctx, bson.M{"endpoint": endpoint})
	return err
}
