package dto

type QueueMessageDto struct {
	Id      int    `json:"id"`
	Message string `json:"message"`
}

type QueueMessagesDto []QueueMessageDto
