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
		c.conn.Close()
	}()

	for {
		_, msg, err := c.conn.ReadMessage()
		if err != nil {
			log.Printf("[WS] error leyendo: %v", err)
			break
		}

		var incoming dto.WSMessage
		if err := json.Unmarshal(msg, &incoming); err != nil {
			log.Printf("[WS] json inválido: %v", err)
			continue
		}

		// Procesar mensaje entrante → enviar por ChatService
		saved, err := c.service.SendMessage(
			context.Background(), // usamos un contexto base
			c.UserID,
			incoming,
		)
		if err != nil {
			log.Printf("[WS] error guardando mensaje: %v", err)
			continue
		}

		// Enviar confirmación al remitente
		out := dto.WSOutgoing{
			Type:    "message:sent",
			Payload: dto.ToMessageResponse(&saved),
		}
		data, _ := json.Marshal(out)
		c.send <- data
	}
}

// WritePump escucha el canal `send` y escribe al WebSocket
func (c *Client) WritePump() {
	ticker := time.NewTicker(30 * time.Second) // ping cada 30s
	defer func() {
		ticker.Stop()
		c.conn.Close()
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
