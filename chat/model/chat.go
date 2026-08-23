package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Chat struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Participants    [2]string          `bson:"participants" json:"participants"`
	ParticipantsKey string             `bson:"participantsKey" json:"participantsKey,omitempty"`
	PostID          string             `bson:"postId" json:"postId"`
	LastUpdate      time.Time          `bson:"lastUpdate" json:"lastUpdate"`
	LastMessage     string             `bson:"lastMessage,omitempty" json:"lastMessage,omitempty"`
	LastSenderID    string             `bson:"lastSenderId,omitempty" json:"lastSenderId,omitempty"`
}
