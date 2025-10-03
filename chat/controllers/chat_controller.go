package controllers

import (
	"chat/dto"
	"chat/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ChatController struct {
	Service *services.ChatService
}

func NewChatController(svc *services.ChatService) *ChatController {
	return &ChatController{Service: svc}
}

// PublicKey devuelve la clave pública VAPID para que el frontend pueda suscribirse
func (cc *ChatController) PublicKey(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"publicKey": cc.Service.PushClientPublicKey(),
	})
}

// Endpoint para registrar suscripción Web Push
func (cc *ChatController) Subscribe(c *gin.Context) {
	var sub dto.PushSubscription
	if err := c.ShouldBindJSON(&sub); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "json inválido"})
		return
	}

	// Extraer userID desde contexto (ejemplo)
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "usuario no autenticado"})
		return
	}

	if err := cc.Service.SavePushSubscription(c.Request.Context(), userID, sub); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo guardar la suscripción"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "suscripción registrada"})
}

// StartChat crea o busca un chat entre dos usuarios respecto a un post
func (cc *ChatController) StartChat(c *gin.Context) {
	var req dto.StartChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	chat, err := cc.Service.StartChat(c.Request.Context(), req.Me, req.Other, req.PostID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.FromChatModel(chat))
}

// ListChats devuelve los chats de un usuario
func (cc *ChatController) ListChats(c *gin.Context) {
	userID := c.Query("userId")
	limitStr := c.DefaultQuery("limit", "20")
	limit, _ := strconv.ParseInt(limitStr, 10, 64)

	chats, err := cc.Service.ListChats(c.Request.Context(), userID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var res []dto.ChatDTO
	for _, ch := range chats {
		res = append(res, dto.FromChatModel(ch))
	}

	c.JSON(http.StatusOK, res)
}

// ListMessages devuelve los mensajes de un chat
func (cc *ChatController) ListMessages(c *gin.Context) {
	chatID := c.Param("chatId")
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.ParseInt(limitStr, 10, 64)

	msgs, err := cc.Service.ListMessages(c.Request.Context(), chatID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var res []dto.MessageDTO
	for _, m := range msgs {
		res = append(res, dto.FromMessageModel(m))
	}

	c.JSON(http.StatusOK, res)
}

// SendMessageHTTP guarda un mensaje en un chat (fallback HTTP)
func (cc *ChatController) SendMessageHTTP(c *gin.Context) {
	var req dto.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	msg, err := cc.Service.SendMessage(c.Request.Context(), req.ChatID, req.SenderID, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.FromMessageModel(msg))
}

// MarkRead marca un chat como leído para un usuario
func (cc *ChatController) MarkRead(c *gin.Context) {
	var req dto.MarkReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	if err := cc.Service.MarkRead(c.Request.Context(), req.ChatID, req.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
