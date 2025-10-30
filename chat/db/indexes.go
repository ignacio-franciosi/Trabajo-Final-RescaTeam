package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// EnsureIndexes crea/migra índices de chats, messages y push_subscriptions.
// - Migra a participantsKey + postId (índice único) para evitar E11000 con arrays.
// - Mantiene los índices existentes de messages y push_subscriptions.
func EnsureIndexes(database *mongo.Database) error {
	// Usamos timeout para no colgar si hay problemas
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	chats := database.Collection("chats")
	messages := database.Collection("messages")
	subs := database.Collection("push_subscriptions")

	// -----------------------------
	// 1) MIGRACIÓN CHATS (participantsKey)
	// -----------------------------

	// 1.1) Backfill participantsKey donde falte
	if err := backfillParticipantsKey(ctx, chats); err != nil {
		return err
	}

	// 1.2) Intentar eliminar índice viejo único en (participants, postId) si existe
	if _, err := chats.Indexes().DropOne(ctx, "participants_1_postId_1"); err == nil {
		log.Println("[EnsureIndexes] índice viejo participants_1_postId_1 eliminado")
	}

	// 1.3) Crear índice ÚNICO en (participantsKey, postId)
	idxUnique := mongo.IndexModel{
		Keys: bson.D{
			{Key: "participantsKey", Value: 1},
			{Key: "postId", Value: 1},
		},
		Options: options.Index().
			SetName("participantsKey_1_postId_1").
			SetUnique(true).
			SetBackground(true),
	}
	if _, err := chats.Indexes().CreateOne(ctx, idxUnique); err != nil {
		return err
	}

	// 1.4) Índice normal en participants (para ListChats por usuario)
	idxParticipants := mongo.IndexModel{
		Keys:    bson.D{{Key: "participants", Value: 1}},
		Options: options.Index().SetName("participants_1").SetBackground(true),
	}
	if _, err := chats.Indexes().CreateOne(ctx, idxParticipants); err != nil {
		return err
	}

	// 1.5) Índice normal en lastUpdate (para ordenamiento)
	idxLastUpdate := mongo.IndexModel{
		Keys:    bson.D{{Key: "lastUpdate", Value: -1}},
		Options: options.Index().SetName("lastUpdate_-1").SetBackground(true),
	}
	if _, err := chats.Indexes().CreateOne(ctx, idxLastUpdate); err != nil {
		return err
	}

	// -----------------------------
	// 2) ÍNDICES MESSAGES (se conservan los tuyos)
	// -----------------------------
	if _, err := messages.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "chatId", Value: 1}, {Key: "timestamp", Value: -1}},
			Options: options.Index().SetBackground(true),
		},
		{
			Keys:    bson.D{{Key: "senderId", Value: 1}},
			Options: options.Index().SetBackground(true),
		},
		{
			Keys:    bson.D{{Key: "chatId", Value: 1}, {Key: "viewed", Value: 1}},
			Options: options.Index().SetBackground(true),
		},
	}); err != nil {
		return err
	}

	// -----------------------------
	// 3) ÍNDICE PUSH SUBSCRIPTIONS (se conserva el tuyo)
	// -----------------------------
	if _, err := subs.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "endpoint", Value: 1}},
		Options: options.Index().SetUnique(true).SetBackground(true),
	}); err != nil {
		return err
	}

	log.Println("Índices OK (migrado a participantsKey + postId, más messages y push_subscriptions)")
	return nil
}

// backfillParticipantsKey completa el campo participantsKey (y normaliza el orden del par)
// para todos los documentos que aún no lo tengan.
func backfillParticipantsKey(ctx context.Context, chats *mongo.Collection) error {
	// Buscamos documentos sin participantsKey
	cur, err := chats.Find(ctx, bson.M{"participantsKey": bson.M{"$exists": false}})
	if err != nil {
		return err
	}
	defer cur.Close(ctx)

	type row struct {
		ID           interface{} `bson:"_id"`
		Participants []string    `bson:"participants"`
	}

	bulkOps := make([]mongo.WriteModel, 0, 500)
	updated := 0

	for cur.Next(ctx) {
		var r row
		if err := cur.Decode(&r); err != nil {
			return err
		}
		if len(r.Participants) != 2 {
			log.Printf("[EnsureIndexes] chat %v con participants inválidos: %v", r.ID, r.Participants)
			continue
		}

		// Orden determinístico
		a, b := r.Participants[0], r.Participants[1]
		if b < a {
			a, b = b, a
		}
		key := a + "#" + b

		up := mongo.NewUpdateOneModel().
			SetFilter(bson.M{"_id": r.ID}).
			SetUpdate(bson.M{
				"$set": bson.M{
					"participants":    [2]string{a, b},
					"participantsKey": key,
				},
			})

		bulkOps = append(bulkOps, up)
		updated++

		if len(bulkOps) >= 500 {
			if _, err := chats.BulkWrite(ctx, bulkOps, options.BulkWrite().SetOrdered(false)); err != nil {
				return err
			}
			bulkOps = bulkOps[:0]
		}
	}
	if err := cur.Err(); err != nil {
		return err
	}

	if len(bulkOps) > 0 {
		if _, err := chats.BulkWrite(ctx, bulkOps, options.BulkWrite().SetOrdered(false)); err != nil {
			return err
		}
	}

	if updated > 0 {
		log.Printf("[EnsureIndexes] backfill participantsKey aplicado a %d chats", updated)
	}
	return nil
}
