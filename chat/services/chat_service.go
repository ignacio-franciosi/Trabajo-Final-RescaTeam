package services

import (
	"chat/clients/push"
	"chat/dto"
	"chat/model"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChatService struct {
	repo       Repository
	hub        *Hub
	pushClient *push.PushClient
}

func NewChatService(r Repository, h *Hub, pc *push.PushClient) *ChatService {
	return &ChatService{repo: r, hub: h, pushClient: pc}
}

// StartChat: crea o busca un chat único por (me, other, postId)
func (s *ChatService) StartChat(ctx context.Context, me, other, postID string) (model.Chat, error) {
	if me == other {
		return model.Chat{}, errors.New("no puedes iniciar chat contigo mismo")
	}
	return s.repo.FindOrCreateChat(ctx, me, other, postID)
}

// SendMessage: guarda mensaje y lo distribuye por WS/Push
func (s *ChatService) SendMessage(ctx context.Context, senderID string, in dto.WSMessage) (model.Message, error) {
	var chat model.Chat
	var err error

	// Resolver el chat
	if in.ChatID != "" {
		// Camino A: chatId
		chat, err = s.repo.GetChat(ctx, in.ChatID)
		if err != nil {
			// Si no existe y vinieron (receiverId + postId), probamos fallback
			if in.ReceiverID != "" && in.PostID != "" {
				chat, err = s.repo.FindOrCreateChat(ctx, senderID, in.ReceiverID, in.PostID)
				if err != nil {
					return model.Message{}, fmt.Errorf("no se pudo resolver chat (fallback): %w", err)
				}
			} else {
				return model.Message{}, fmt.Errorf("chatId inválido o no existe: %w", err)
			}
		}
	} else if in.ReceiverID != "" && in.PostID != "" {
		// Camino B: receiverId + postId
		chat, err = s.repo.FindOrCreateChat(ctx, senderID, in.ReceiverID, in.PostID)
		if err != nil {
			return model.Message{}, fmt.Errorf("no se pudo crear/buscar chat: %w", err)
		}
	} else {
		return model.Message{}, errors.New("faltan datos: chatId o (receiverId + postId)")
	}

	// Validar que el remitente pertenezca al chat
	if !s.hub.IsUserInChat(senderID, chat) {
		return model.Message{}, errors.New("no tienes permiso en este chat")
	}

	// Validar contenido
	content := strings.TrimSpace(in.Content)
	if content == "" {
		return model.Message{}, errors.New("contenido vacío")
	}

	// Crear y persistir mensaje
	msg := model.Message{
		ID:        primitive.NewObjectID(),
		ChatID:    chat.ID,
		SenderID:  senderID,
		Content:   content,
		Timestamp: time.Now(),
		Viewed:    false,
	}
	saved, err := s.repo.SaveMessage(ctx, msg)
	if err != nil {
		return model.Message{}, err
	}

	// Determinar receptor
	var receiver string
	if chat.Participants[0] == senderID {
		receiver = chat.Participants[1]
	} else {
		receiver = chat.Participants[0]
	}

	// Notificar por WS
	out := dto.WSOutgoing{
		Type:    "message",
		Payload: dto.ToMessageResponse(&saved),
	}
	s.hub.SendToUser(receiver, out)

	// Fallback Push si receptor no está conectado
	if !s.hub.HasConnections(receiver) {
		subs, err := s.repo.ListSubscriptions(ctx, receiver)
		if err == nil && len(subs) > 0 {
			payload := map[string]interface{}{
				"title": "Nuevo mensaje",
				"body":  saved.Content,
				"data": map[string]string{
					"chatId":   saved.ChatID.Hex(),
					"fromUser": senderID,
				},
			}
			data, _ := json.Marshal(payload)

			failed := s.pushClient.SendNotifications(ctx, subs, data)
			for _, ep := range failed {
				_ = s.repo.DeleteSubscription(ctx, ep)
			}
		}
	}

	return saved, nil
}

// Exponer clave pública
func (s *ChatService) PushClientPublicKey() string {
	return s.pushClient.PublicKey()
}

// Passthroughs
func (s *ChatService) ListChats(ctx context.Context, me string, limit int64) ([]model.Chat, error) {
	return s.repo.ListChats(ctx, me, limit)
}

func (s *ChatService) ListMessages(ctx context.Context, chatID string, limit int64) ([]model.Message, error) {
	return s.repo.ListMessages(ctx, chatID, limit)
}

func (s *ChatService) MarkRead(ctx context.Context, chatID, userID string) error {
	return s.repo.MarkRead(ctx, chatID, userID)
}

// SavePushSubscription guarda la suscripción en DB (llamada desde controller)
func (s *ChatService) SavePushSubscription(ctx context.Context, userID string, in dto.PushSubscription) error {
	sub := model.PushSubscription{
		ID:       primitive.NewObjectID(),
		UserID:   userID,
		Endpoint: in.Endpoint,
		Keys: model.PushSubscriptionKeys{
			P256dh: in.Keys.P256dh,
			Auth:   in.Keys.Auth,
		},
		CreatedAt: time.Now(),
	}
	return s.repo.SaveSubscription(ctx, sub)
}

// Devuelve la instancia de PushClient
func (s *ChatService) GetPushClient() *push.PushClient {
	return s.pushClient
}
