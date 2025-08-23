package model

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Image struct {
	ImageId  primitive.ObjectID `bson:"_id"`
	PostId   string             `bson:"postId"`
	Filepath string             `bson:"filepath"`
}

type Images []Image
