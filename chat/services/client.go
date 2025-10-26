package services

import (
	"chat/dto"
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

// Client representa una conexión WebSocket activa
type Client struct {
	hub     *Hub
	conn    *websocket.Conn
	service *ChatService

	send   chan []byte // canal de salida para enviar mensajes al WS
	UserID string      // userID del usuario conectado
}

// NewClient crea un nuevo cliente WebSocket
func NewClient(hub *Hub, conn *websocket.Conn, svc *ChatService) *Client {
	return &Client{
		hub:     hub,
		conn:    conn,
		service: svc,
		send:    make(chan []byte, 256),
	}
}

// ReadPump escucha mensajes entrantes desde el WebSocket
func (c *Client) ReadPump() {
	defer func() {
		c.hub.RemoveConnection(c.UserID, c)
		_ = c.conn.Close()
	}()

	for {
		_, msg, err := c.conn.ReadMessage()
		if err != nil {
			log.Printf("[WS] error leyendo: %v", err)
			break
		}

		// 1) Wrapper
		var incoming dto.WSIncoming
		if err := json.Unmarshal(msg, &incoming); err != nil {
			log.Printf("[WS] json inválido: %v", err)
			continue
		}

		switch incoming.Type {
		case "send_message":
			var payload dto.WSMessage
			if err := json.Unmarshal(incoming.Payload, &payload); err != nil {
				log.Printf("[WS] payload inválido send_message: %v", err)
				continue
			}

			saved, err := c.service.SendMessage(
				context.Background(),
				c.UserID,
				payload,
			)
			if err != nil {
				log.Printf("[WS] error guardando mensaje: %v", err)
				_ = c.conn.WriteJSON(dto.WSOutgoing{Type: "error", Payload: err.Error()})
				continue
			}

			// Enviar confirmación al remitente
			out := dto.WSOutgoing{
				Type:    "message:sent",
				Payload: dto.ToMessageResponse(&saved),
			}
			data, _ := json.Marshal(out)
			c.send <- data

		case "chat:active":
			var payload dto.WSChatActive
			if err := json.Unmarshal(incoming.Payload, &payload); err != nil {
				log.Printf("[WS] payload inválido chat:active: %v", err)
				continue
			}

			if err := c.service.MarkRead(context.Background(), payload.ChatID, c.UserID); err != nil {
				log.Printf("[WS] error mark read: %v", err)
				_ = c.conn.WriteJSON(dto.WSOutgoing{Type: "error", Payload: err.Error()})
				continue
			}

			_ = c.conn.WriteJSON(dto.WSOutgoing{
				Type:    "ack",
				Payload: map[string]string{"ok": "read"},
			})

		default:
			_ = c.conn.WriteJSON(dto.WSOutgoing{
				Type:    "error",
				Payload: "unknown type",
			})
		}
	}
}

// WritePump escucha el canal `send` y escribe al WebSocket
func (c *Client) WritePump() {
	ticker := time.NewTicker(55 * time.Second) // ping cada 55s
	defer func() {
		ticker.Stop()
		_ = c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				// canal cerrado → cerrar conexión
				_ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("[WS] error enviando: %v", err)
				return
			}
		case <-ticker.C:
			// enviar ping para mantener viva la conexión
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("[WS] error en ping: %v", err)
				return
			}
		}
	}
}

// WriteJSON implementa la interfaz Conn usada en Hub
func (c *Client) WriteJSON(v interface{}) error {
	return c.conn.WriteJSON(v)
}

// Close implementa la interfaz Conn usada en Hub
func (c *Client) Close() error {
	return c.conn.Close()
}
