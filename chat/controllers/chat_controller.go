package controllers

import (
	"chat/dto"
	"chat/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Permite cualquier origen (ajustar en prod)
	},
}

func HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al iniciar websocket"})
		return
	}
	defer conn.Close()

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}

		message := dto.MessageDTO{
			User:    "anon",
			Content: string(msg),
		}

		// Guardar mensaje
		services.SaveMessage(message)

		// Responder eco
		if err := conn.WriteMessage(websocket.TextMessage, []byte("Recibido: "+string(msg))); err != nil {
			break
		}
	}
}

func SendMessage(c *gin.Context) {
	var message dto.MessageDTO
	if err := c.ShouldBindJSON(&message); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	services.SaveMessage(message)
	c.JSON(http.StatusOK, gin.H{"status": "mensaje guardado"})
}
