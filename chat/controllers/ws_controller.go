package controllers

import (
	"chat/dto"
	"chat/services"
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
	return &WSController{hub: hub, service: svc, jwtSecret: jwtSecret}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // ⚠️ ajustar en prod
	},
}

// Upgrade inicia la conexión WebSocket autenticada
func (wsc *WSController) Upgrade(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo iniciar WebSocket"})
		return
	}

	client := services.NewClient(wsc.hub, conn, wsc.service)
	wsc.hub.Register <- client

	go client.ReadPump()
	go client.WritePump()
}

// HandleWebSocket abre la conexión WebSocket y procesa mensajes en tiempo real
func (wsc *WSController) HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo iniciar WebSocket"})
		return
	}
	defer conn.Close()

	for {
		var req dto.SendMessageRequest
		if err := conn.ReadJSON(&req); err != nil {
			break
		}

		msg, err := wsc.Service.SendMessage(c.Request.Context(), req.ChatID, req.SenderID, req.Content)
		if err != nil {
			conn.WriteJSON(gin.H{"error": err.Error()})
			continue
		}

		// Responder mensaje confirmado
		_ = conn.WriteJSON(dto.FromMessageModel(msg))
	}
}
