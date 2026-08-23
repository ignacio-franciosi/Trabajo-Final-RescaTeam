package repositories

import (
	"chat/model"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type PushRepository struct {
	col *mongo.Collection
}

func NewPushRepository(db *mongo.Database) *PushRepository {
	return &PushRepository{
		col: db.Collection("push_subscriptions"),
	}
}

// SaveSubscription guarda o actualiza la suscripción (upsert por userID+endpoint)
func (r *PushRepository) SaveSubscription(ctx context.Context, userID string, sub model.PushSubscription) error {
	sub.UserID = userID
	sub.CreatedAt = time.Now()

	filter := bson.M{"userId": userID, "endpoint": sub.Endpoint}
	update := bson.M{"$set": sub}

	_, err := r.col.UpdateOne(
		ctx,
		filter,
		update,
		options.Update().SetUpsert(true),
	)
	return err
}

// ListSubscriptions obtiene todas las suscripciones de un usuario
func (r *PushRepository) ListSubscriptions(ctx context.Context, userID string) ([]model.PushSubscription, error) {
	var subs []model.PushSubscription
	cursor, err := r.col.Find(ctx, bson.M{"userId": userID})
	if err != nil {
		return nil, err
	}
	if err := cursor.All(ctx, &subs); err != nil {
		return nil, err
	}
	return subs, nil
}

// DeleteSubscription elimina una suscripción específica por endpoint
func (r *PushRepository) DeleteSubscription(ctx context.Context, endpoint string) error {
	_, err := r.col.DeleteOne(ctx, bson.M{"endpoint": endpoint})
	return err
}

// DeleteSubscriptions elimina varias suscripciones inválidas a la vez
func (r *PushRepository) DeleteSubscriptions(ctx context.Context, endpoints []string) error {
	if len(endpoints) == 0 {
		return nil
	}
	_, err := r.col.DeleteMany(ctx, bson.M{"endpoint": bson.M{"$in": endpoints}})
	return err
}

// UpsertSubscriptionByEndpoint: inserta/actualiza por endpoint (idempotente)
func (r *PushRepository) UpsertSubscriptionByEndpoint(ctx context.Context, userID string, sub model.PushSubscription) error {
	now := time.Now()

	filter := bson.M{"endpoint": sub.Endpoint}
	update := bson.M{
		"$set": bson.M{
			"userId":      userID,
			"endpoint":    sub.Endpoint,
			"keys.p256dh": sub.Keys.P256dh,
			"keys.auth":   sub.Keys.Auth,
			"updatedAt":   now,
		},
		"$setOnInsert": bson.M{
			"createdAt": now,
		},
	}

	opts := options.Update().SetUpsert(true)
	_, err := r.col.UpdateOne(ctx, filter, update, opts)
	return err
}
