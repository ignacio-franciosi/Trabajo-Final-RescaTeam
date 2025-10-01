package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PushSubscriptionKeys struct {
	P256dh string `bson:"p256dh" json:"p256dh"`
	Auth   string `bson:"auth" json:"auth"`
}

type PushSubscription struct {
	ID        primitive.ObjectID   `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    string               `bson:"userId" json:"userId"`
	Endpoint  string               `bson:"endpoint" json:"endpoint"`
	Keys      PushSubscriptionKeys `bson:"keys" json:"keys"`
	CreatedAt time.Time            `bson:"createdAt" json:"createdAt"`
}
