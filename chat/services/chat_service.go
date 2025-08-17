package services

import (
	"chat/clients"
	"chat/dto"
	"chat/model"
	"chat/utils"
	"context"
	"time"
)

func SaveMessage(dto dto.MessageDTO) {
	collection := clients.MongoClient.Database("chatdb").Collection("messages")

	message := model.Message{
		User:      dto.User,
		Content:   dto.Content,
		CreatedAt: time.Now(),
	}

	_, err := collection.InsertOne(context.TODO(), message)
	if err != nil {
		utils.LogError("Error al guardar mensaje: " + err.Error())
	}
}
