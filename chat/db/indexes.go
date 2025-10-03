package db

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// EnsureIndexes crea índices básicos para colecciones de chat, messages y push_subscriptions
func EnsureIndexes(database *mongo.Database) error {
	ctx := context.Background()

	// chats: índice compuesto único (participants + postId)
	chats := database.Collection("chats")
	_, err := chats.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "participants", Value: 1}, {Key: "postId", Value: 1}},
			Options: options.Index().SetUnique(true).SetBackground(true),
		},
		{
			Keys:    bson.D{{Key: "lastUpdate", Value: -1}},
			Options: options.Index().SetBackground(true),
		},
	})
	if err != nil {
		return err
	}

	// messages
	messages := database.Collection("messages")
	_, err = messages.Indexes().CreateMany(ctx, []mongo.IndexModel{
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
	})
	if err != nil {
		return err
	}

	// push_subscriptions - índice único por endpoint
	subs := database.Collection("push_subscriptions")
	_, err = subs.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "endpoint", Value: 1}},
		Options: options.Index().SetUnique(true).SetBackground(true),
	})
	if err != nil {
		return err
	}

	log.Println("✅ Índices creados en MongoDB (chats, messages, push_subscriptions)")
	return nil
}
