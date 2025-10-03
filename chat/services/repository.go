package services

import (
	"chat/model"
	"context"
	"errors"
	"sort"
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

// 1) Buscar chat por (participants + postID) o crearlo
func (r *MongoRepository) FindOrCreateChat(ctx context.Context, me, other, postID string) (model.Chat, error) {
	parts := sortedPair(me, other)

	// Buscamos por igualdad exacta del array (como lo guardamos ordenado)
	filter := bson.M{
		"participants": parts,
		"postId":       postID,
	}

	var chat model.Chat
	err := r.chatsCol.FindOne(ctx, filter).Decode(&chat)
	if err == mongo.ErrNoDocuments {
		now := time.Now()
		chat = model.Chat{
			ID:           primitive.NewObjectID(),
			Participants: parts,
			PostID:       postID,
			LastUpdate:   now,
			LastMessage:  "",
			LastSenderID: "",
		}
		if _, err := r.chatsCol.InsertOne(ctx, chat); err != nil {
			return model.Chat{}, err
		}
		return chat, nil
	}
	if err != nil {
		return model.Chat{}, err
	}
	return chat, nil
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

	// match donde el array 'participants' contenga 'me'
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
	// Asegurar IDs/timestamp
	if m.ID.IsZero() {
		m.ID = primitive.NewObjectID()
	}
	if m.Timestamp.IsZero() {
		m.Timestamp = time.Now()
	}

	if _, err := r.messagesCol.InsertOne(ctx, m); err != nil {
		return model.Message{}, err
	}

	// Actualizar cabecera del chat
	_, _ = r.chatsCol.UpdateByID(ctx, m.ChatID, bson.M{
		"$set": bson.M{
			"lastUpdate":   m.Timestamp,
			"lastMessage":  m.Content,
			"lastSenderId": m.SenderID,
		},
	})

	return m, nil
}

// 5) Listar mensajes de un chat (últimos N → en orden cronológico)
func (r *MongoRepository) ListMessages(ctx context.Context, chatID string, limit int64) ([]model.Message, error) {
	objID, err := primitive.ObjectIDFromHex(chatID)
	if err != nil {
		return nil, errors.New("chatId inválido")
	}

	// Traemos descendente para obtener los más recientes y luego invertimos
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

	// Invertimos para devolver de más antiguo → más nuevo
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs, nil
}

// 6) Marcar mensajes como leídos para un usuario (los que NO envió él)
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

/* -------- Push subscriptions (persistencia) -------- */

// SaveSubscription guarda una suscripción en la colección "push_subscriptions"
func (r *MongoRepository) SaveSubscription(ctx context.Context, sub model.PushSubscription) error {
	// aseguramos ID / CreatedAt
	if sub.ID.IsZero() {
		sub.ID = primitive.NewObjectID()
	}
	if sub.CreatedAt.IsZero() {
		sub.CreatedAt = time.Now()
	}

	_, err := r.pushCol.InsertOne(ctx, sub)
	// ignorar duplicados por endpoint (11000)
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
