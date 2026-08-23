package dto

import (
	"chat/model"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ---------- REQUESTS ----------

// StartChatRequest: datos mínimos para iniciar un chat
type StartChatRequest struct {
	ReceiverID StringOrNumber `json:"receiverId" binding:"required"`
	PostID     string         `json:"postId" binding:"required"`
}

// SendMessageRequest: enviar mensaje por HTTP (fallback)
type SendMessageRequest struct {
	ChatID      string         `json:"chatId,omitempty"`
	ReceiverID  StringOrNumber `json:"receiverId"` // preferido
	ReceiverAlt StringOrNumber `json:"receiver"`
	PostID      string         `json:"postId,omitempty"`
	Content     string         `json:"content" binding:"required,min=1,max=2000"`
}

// ---------- RESPONSES ----------

type ChatResponse struct {
	ChatID       string    `json:"chatId"`
	Participants [2]string `json:"participants"`
	PostID       string    `json:"postId"`
	LastUpdate   time.Time `json:"lastUpdate"`
	LastMessage  string    `json:"lastMessage,omitempty"`
	LastSenderID string    `json:"lastSenderId,omitempty"`
}

type MessageResponse struct {
	MessageID string    `json:"messageId"`
	ChatID    string    `json:"chatId"`
	SenderID  string    `json:"senderId"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
	Viewed    bool      `json:"viewed"`
}

type MarkReadRequest struct {
	ChatID string `json:"chatId" binding:"required"`
}

// ---------- MAPPERS ----------

func ToChatResponse(chat *model.Chat) ChatResponse {
	return ChatResponse{
		ChatID:       chat.ID.Hex(),
		Participants: chat.Participants,
		PostID:       chat.PostID,
		LastUpdate:   chat.LastUpdate,
		LastMessage:  chat.LastMessage,
		LastSenderID: chat.LastSenderID,
	}
}

func ToMessageResponse(msg *model.Message) MessageResponse {
	return MessageResponse{
		MessageID: msg.ID.Hex(),
		ChatID:    msg.ChatID.Hex(),
		SenderID:  msg.SenderID,
		Content:   msg.Content,
		Timestamp: msg.Timestamp,
		Viewed:    msg.Viewed,
	}
}

// Helper inverso: de string a ObjectID (para buscar en Mongo)
func ParseObjectID(id string) (primitive.ObjectID, error) {
	return primitive.ObjectIDFromHex(id)
}

// Helper para obtener el receiverId normalizado
func (r SendMessageRequest) NormalizedReceiverID() string {
	if r.ReceiverID != "" {
		return r.ReceiverID.String()
	}
	if r.ReceiverAlt != "" {
		return r.ReceiverAlt.String()
	}
	return ""
}
