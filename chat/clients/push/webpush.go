package push

import (
	"chat/dto"
	"chat/model"
	"context"
	"encoding/json"
	"io"
	"log"
	"sync"

	webpush "github.com/SherClockHolmes/webpush-go"
)

type PushClient struct {
	privKey string
	pubKey  string

	mu            sync.RWMutex
	subscriptions map[string][]dto.PushSubscription // opcional: cache en memoria
}

func NewPushClient(pubKey, privKey string) *PushClient {
	return &PushClient{
		privKey:       privKey,
		pubKey:        pubKey,
		subscriptions: make(map[string][]dto.PushSubscription),
	}
}

// PublicKey devuelve la clave pública (para frontend)
func (pc *PushClient) PublicKey() string {
	return pc.pubKey
}

// Guardar suscripción en memoria (solo cache, no DB)
func (pc *PushClient) SaveSubscription(userID string, sub dto.PushSubscription) {
	pc.mu.Lock()
	defer pc.mu.Unlock()

	pc.subscriptions[userID] = append(pc.subscriptions[userID], sub)
	log.Printf("[Push] suscripción guardada en memoria para user=%s", userID)
}

// Enviar notificación push a un usuario usando cache en memoria
func (pc *PushClient) SendPush(userID, title, body, chatID string) {
	pc.mu.RLock()
	subs := pc.subscriptions[userID]
	pc.mu.RUnlock()

	if len(subs) == 0 {
		log.Printf("[Push] no hay suscripciones en memoria para user=%s", userID)
		return
	}

	payload := map[string]interface{}{
		"title": title,
		"body":  body,
		"data": map[string]string{
			"chatId": chatID,
		},
	}
	data, _ := json.Marshal(payload)

	for _, sub := range subs {
		_, err := webpush.SendNotification(data, &webpush.Subscription{
			Endpoint: sub.Endpoint,
			Keys: webpush.Keys{
				Auth:   sub.Keys.Auth,
				P256dh: sub.Keys.P256dh,
			},
		}, &webpush.Options{
			Subscriber:      "mailto:admin@rescateam.com", // cámbialo por tu mail real
			VAPIDPublicKey:  pc.pubKey,
			VAPIDPrivateKey: pc.privKey,
			TTL:             30,
		})
		if err != nil {
			log.Printf("[Push] error enviando a user=%s: %v", userID, err)
		}
	}
}

// Enviar notificación a una lista de suscripciones (desde DB)
func (pc *PushClient) SendNotifications(ctx context.Context, subs []model.PushSubscription, payload []byte) (failed []string) {
	for _, sub := range subs {
		subObj := &webpush.Subscription{
			Endpoint: sub.Endpoint,
			Keys: webpush.Keys{
				Auth:   sub.Keys.Auth,
				P256dh: sub.Keys.P256dh,
			},
		}

		resp, err := webpush.SendNotification(payload, subObj, &webpush.Options{
			Subscriber:      "mailto:admin@rescateam.com", // cámbialo por tu mail real
			VAPIDPublicKey:  pc.pubKey,
			VAPIDPrivateKey: pc.privKey,
			TTL:             60,
		})
		if err != nil {
			log.Printf("[Push] error enviando a endpoint=%s: %v", sub.Endpoint, err)
			failed = append(failed, sub.Endpoint)
			continue
		}
		// consumir body y cerrarlo
		_, _ = io.Copy(io.Discard, resp.Body)
		resp.Body.Close()
	}
	return failed
}
