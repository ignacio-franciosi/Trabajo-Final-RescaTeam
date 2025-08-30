package db

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// EnsureIndexes crea índices básicos para colecciones de chat y mensajes
func EnsureIndexes(database *mongo.Database) error {
	ctx := context.Background()

	// Índices para chats
	chats := database.Collection("chats")
	_, err := chats.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    map[string]interface{}{"participants": 1},
			Options: options.Index().SetBackground(true),
		},
	})
	if err != nil {
		return err
	}

	// Índices para mensajes
	messages := database.Collection("messages")
	_, err = messages.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    map[string]interface{}{"chatId": 1, "createdAt": -1},
			Options: options.Index().SetBackground(true),
		},
		{
			Keys:    map[string]interface{}{"senderId": 1},
			Options: options.Index().SetBackground(true),
		},
	})
	if err != nil {
		return err
	}

	log.Println("Índices creados en MongoDB")
	return nil
}
