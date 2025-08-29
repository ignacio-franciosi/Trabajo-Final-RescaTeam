package services

import (
	"chat/dto"
	"chat/model"
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChatService struct {
	repo Repository
	hub  *Hub
}

func NewChatService(r Repository, h *Hub) *ChatService {
	return &ChatService{repo: r, hub: h}
}

func (s *ChatService) StartChat(ctx context.Context, me, receiverID, postID string) (model.Chat, error) {
	if me == receiverID {
		return model.Chat{}, errors.New("no puedes iniciar chat contigo mismo")
	}

	chat, err := s.repo.FindOrCreateChat(ctx, me, receiverID, postID)
	if err != nil {
		return model.Chat{}, err
	}
	return chat, nil
}

func (s *ChatService) SendMessage(ctx context.Context, senderID string, in dto.WSMessage) (model.Message, error) {
	var chat model.Chat
	var err error

	// 1) Resolver chat
	if in.ChatID == "" && in.ReceiverID != "" && in.PostID != "" {
		chat, err = s.repo.FindOrCreateChat(ctx, senderID, in.ReceiverID, in.PostID)
		if err != nil {
			return model.Message{}, err
		}
	} else if in.ChatID != "" {
		chat, err = s.repo.GetChat(ctx, in.ChatID)
		if err != nil {
			return model.Message{}, err
		}
	} else {
		return model.Message{}, errors.New("faltan datos para enviar mensaje")
	}

	// 2) Sanitizar content
	content := strings.TrimSpace(in.Content)
	if len(content) == 0 {
		return model.Message{}, errors.New("contenido vacío")
	}

	// 3) Crear mensaje
	msg := model.Message{
		ID:        primitive.NewObjectID(),
		ChatID:    chat.ID,
		SenderID:  senderID,
		Content:   content,
		CreatedAt: time.Now(),
		ReadBy:    []string{senderID},
	}

	saved, err := s.repo.SaveMessage(ctx, msg)
	if err != nil {
		return model.Message{}, err
	}

	// 4) Determinar receptor
	receiverID := chat.User1
	if chat.User1 == senderID {
		receiverID = chat.User2
	}

	// 5) Notificar por WS
	out := dto.WSOutgoing{
		Type:    "message",
		Payload: saved.ToMessageResponse(),
	}
	s.hub.SendToUser(receiverID, out)

	// TODO: si receptor offline => push notifications
	return saved, nil
}
