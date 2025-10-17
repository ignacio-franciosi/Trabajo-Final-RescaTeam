package controllers

import (
	"chat/dto"
	"chat/services"
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type WSController struct {
	hub       *services.Hub
	Service   *services.ChatService
	jwtSecret string
}

func NewWSController(hub *services.Hub, svc *services.ChatService, jwtSecret string) *WSController {
	return &WSController{hub: hub, Service: svc, jwtSecret: jwtSecret}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // ⚠️ En producción ajustar
	},
}

// Upgrade inicia la conexión WebSocket autenticada
func (wsc *WSController) Upgrade(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo iniciar WebSocket"})
		return
	}

	// userID desde JWT
	userID := c.GetString("userId")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "usuario no autenticado"})
		conn.Close()
		return
	}

	client := services.NewClient(wsc.hub, conn, wsc.Service)
	client.UserID = userID
	wsc.hub.AddConnection(userID, client)

	go client.ReadPump()
	go client.WritePump()
}

// HandleWebSocket procesa mensajes en tiempo real (fallback básico)
func (wsc *WSController) HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo iniciar WebSocket"})
		return
	}
	defer conn.Close()

	userID := c.GetString("userId")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "usuario no autenticado"})
		return
	}

	for {
		var req dto.SendMessageRequest
		if err := conn.ReadJSON(&req); err != nil {
			break
		}

		// Construir WSMessage
		msg, err := wsc.Service.SendMessage(
			context.Background(),
			userID,
			dto.WSMessage{
				ChatID:     req.ChatID,
				ReceiverID: req.NormalizedReceiverID(), // en el DTO podés tenerlo
				PostID:     req.PostID,
				Content:    req.Content,
			},
		)
		if err != nil {
			conn.WriteJSON(gin.H{"error": err.Error()})
			continue
		}

		// Responder mensaje confirmado
		_ = conn.WriteJSON(dto.ToMessageResponse(&msg))
	}
}
