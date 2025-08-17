package model

import "time"

type Message struct {
	ID        string    `bson:"_id,omitempty"`
	User      string    `bson:"user"`
	Content   string    `bson:"content"`
	CreatedAt time.Time `bson:"created_at"`
}
