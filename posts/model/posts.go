package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Post struct {
	PostId           primitive.ObjectID `bson:"_id"`
	UserId           int                `bson:"userId"`
	PostType         string             `bson:"postType"`
	PostStatus       bool               `bson:"postStatus"`
	Name             *string            `bson:"name,omitempty"`
	Species          *string            `bson:"species,omitempty"`
	Age              *int               `bson:"age,omitempty"`
	Breed            *string            `bson:"breed,omitempty"`
	Color            *string            `bson:"color,omitempty"`
	Size             *string            `bson:"size,omitempty"`
	Sex              *string            `bson:"sex,omitempty"`
	Description      *string            `bson:"description,omitempty"`
	Neutered         *bool              `bson:"neutered,omitempty"`
	CompleteVaccines *bool              `bson:"completeVaccines,omitempty"`
	Date             *string            `bson:"date,omitempty"`
	Zone             *string            `bson:"zone,omitempty"`
	HealthStatus     *string            `bson:"healthStatus,omitempty"`
	Collar           *bool              `bson:"collar,omitempty"`
	CollarColor      *string            `bson:"collarColor,omitempty"`
}

type Posts []Post
