package services

import (
	"chat/clients/push"
	"chat/dto"
	"chat/model"
	"context"
	"errors"
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

func (s *ChatService) StartChat(ctx context.Context, me, receiverID, postID string) (model.Chat, error) {
	if me == receiverID {
		return model.Chat{}, errors.New("no puedes iniciar chat contigo mismo")
	}
	return s.repo.FindOrCreateChat(ctx, me, receiverID, postID)
}

func (s *ChatService) SendMessage(ctx context.Context, senderID string, in dto.WSMessage) (model.Message, error) {
	// 1) Resolver chat
	var chat model.Chat
	var err error

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
		return model.Message{}, errors.New("faltan datos: chatId o (receiverId + postId)")
	}

	// 2) Validar que el usuario sea participante del chat
	if !s.hub.IsUserInChat(senderID, chat) {
		return model.Message{}, errors.New("no tienes permiso para enviar mensajes en este chat")
	}

	// 3) Validar contenido
	content := strings.TrimSpace(in.Content)
	if content == "" {
		return model.Message{}, errors.New("contenido vacío")
	}

	// 4) Crear y guardar mensaje
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

	// 5) Determinar receptor y notificar por WS
	var receiver string
	if chat.Participants[0] == senderID {
		receiver = chat.Participants[1]
	} else {
		receiver = chat.Participants[0]
	}

	out := dto.WSOutgoing{
		Type:    "message",
		Payload: dto.ToMessageResponse(&saved),
	}
	s.hub.SendToUser(receiver, out)

	// 6) Si receptor NO está conectado, fallback push
	if !s.hub.HasConnections(receiver) {
		_ = s.pushClient.SendPush(receiver,
			"Nuevo mensaje",
			saved.Content,
			saved.ChatID.Hex(),
		)
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
