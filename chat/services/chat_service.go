package services

import (
	"chat/clients/push"
	"chat/dto"
	"chat/model"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// PushClientInterface define los métodos del PushClient para permitir mocking
type PushClientInterface interface {
	PublicKey() string
	SendNotifications(ctx context.Context, subs []model.PushSubscription, payload []byte) []string
}

type ChatService struct {
	repo       Repository
	hub        HubInterface
	pushClient PushClientInterface
}

func NewChatService(r Repository, h HubInterface, pc PushClientInterface) *ChatService {
	return &ChatService{repo: r, hub: h, pushClient: pc}
}

// StartChat: crea o busca un chat único por (me, other, postId)
func (s *ChatService) StartChat(ctx context.Context, me, other, postID string) (model.Chat, error) {
	if me == other {
		return model.Chat{}, errors.New("no puedes iniciar chat contigo mismo")
	}
	return s.repo.FindOrCreateChat(ctx, me, other, postID)
}

// helper: verificar pertenencia al chat (robusto, sin depender del hub)
func userBelongsToChat(userID string, chat model.Chat) bool {
	return chat.Participants[0] == userID || chat.Participants[1] == userID
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

	// Validar que el remitente pertenezca al chat (no dependemos sólo del hub)
	if !userBelongsToChat(senderID, chat) {
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

	// Notificar por WS al receptor
	out := dto.WSOutgoing{
		Type:    "message",
		Payload: dto.ToMessageResponse(&saved),
	}
	s.hub.SendToUser(receiver, out)

	// --------- PUSH ---------
	sendPushEvenIfOnline := true // ponelo true si querés probar push siempre
	online := s.hub.HasConnections(receiver)

	if sendPushEvenIfOnline || !online {
		subs, err := s.repo.ListSubscriptions(ctx, receiver)
		if err != nil {
			// log sin romper el flujo
			fmt.Printf("[PUSH] error ListSubscriptions(%s): %v\n", receiver, err)
		}
		if len(subs) > 0 {
			// intentar resolver nombre público del remitente desde el micro de Users
			senderName := senderID
			usersBase := os.Getenv("USERS_BASE_URL")
			if usersBase == "" {
				usersBase = "http://localhost:8080"
			}
			// endpoint esperado: /user/public/{id}
			url := fmt.Sprintf("%s/user/public/%s", strings.TrimRight(usersBase, "/"), senderID)
			if resp, err := http.Get(url); err == nil {
				defer resp.Body.Close()
				if resp.StatusCode == http.StatusOK {
					if b, rerr := io.ReadAll(resp.Body); rerr == nil {
						var info map[string]interface{}
						if jerr := json.Unmarshal(b, &info); jerr == nil {
							// buscar name + surname
							name := ""
							if v, ok := info["name"].(string); ok {
								name = v
							}
							if v, ok := info["surname"].(string); ok && v != "" {
								if name != "" {
									name = name + " " + v
								} else {
									name = v
								}
							}
							if name != "" {
								senderName = name
							}
						}
					}
				}
			}

			payload := map[string]interface{}{
				"title": "Rescateam",
				"body":  fmt.Sprintf("Nuevo mensaje de %s\n%s", senderName, saved.Content),
				"data": map[string]string{
					"chatId":       saved.ChatID.Hex(),
					"fromUser":     senderID,
					"fromUserName": senderName,
				},
			}
			data, _ := json.Marshal(payload)

			failed := s.pushClient.SendNotifications(ctx, subs, data)
			if len(failed) > 0 {
				fmt.Printf("[PUSH] endpoints fallidos (%d): %v\n", len(failed), failed)
				for _, ep := range failed {
					_ = s.repo.DeleteSubscription(ctx, ep)
				}
			} else {
				fmt.Printf("[PUSH] enviadas a %d subs del user %s (online=%v)\n", len(subs), receiver, online)
			}
		} else {
			fmt.Printf("[PUSH] user %s sin subs registradas (online=%v)\n", receiver, online)
		}
	} else {
		fmt.Printf("[PUSH] receptor %s online por WS; no se envía push\n", receiver)
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
	// Primero obtenemos el chat para saber quién es el otro usuario
	chat, err := s.repo.GetChat(ctx, chatID)
	if err != nil {
		return err
	}

	// Verificar que el usuario pertenezca al chat
	if !userBelongsToChat(userID, chat) {
		return errors.New("no tienes permiso en este chat")
	}

	// Marcar mensajes como leídos
	err = s.repo.MarkRead(ctx, chatID, userID)
	if err != nil {
		return err
	}

	// Determinar el otro usuario (el que envió los mensajes)
	var otherUser string
	if chat.Participants[0] == userID {
		otherUser = chat.Participants[1]
	} else {
		otherUser = chat.Participants[0]
	}

	// Enviar evento de "viewed" al otro usuario por WebSocket
	out := dto.WSOutgoing{
		Type: "messages:viewed",
		Payload: map[string]string{
			"chatId":   chatID,
			"viewedBy": userID,
		},
	}
	s.hub.SendToUser(otherUser, out)

	return nil
}

// SavePushSubscription guarda la suscripción en DB (llamada desde controller)
func (s *ChatService) SavePushSubscription(ctx context.Context, userID string, in dto.PushSubscription) error {
	// OJO: ahora delega en el upsert del repo para endpoint
	sub := model.PushSubscription{
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
	if pc, ok := s.pushClient.(*push.PushClient); ok {
		return pc
	}
	return nil
}

func (s *ChatService) RepoDeleteSubscription(ctx context.Context, endpoint string) error {
	return s.repo.DeleteSubscription(ctx, endpoint)
}
