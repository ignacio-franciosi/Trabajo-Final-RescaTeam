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
		s.pushClient.SendPush(receiver,
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
