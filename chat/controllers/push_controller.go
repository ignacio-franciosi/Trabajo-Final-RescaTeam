package controllers

import (
	"chat/clients/push"
	"chat/dto"
	"chat/model"
	"chat/repositories"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PushController struct {
	repo       *repositories.PushRepository
	pushClient *push.PushClient
}

func NewPushController(repo *repositories.PushRepository, pc *push.PushClient) *PushController {
	return &PushController{repo: repo, pushClient: pc}
}

// GET /api/push/public-key
func (ctl *PushController) PublicKey(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"publicKey": ctl.pushClient.PublicKey(),
	})
}

// POST /api/push/subscribe
func (ctl *PushController) Subscribe(c *gin.Context) {
	userID := c.GetString("userId") // viene del middleware JWT
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// IMPORTANTE: el frontend envía dto.PushSubscription (con base64url)
	var in dto.PushSubscription
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "json inválido"})
		return
	}

	sub := model.PushSubscription{
		Endpoint: in.Endpoint,
		Keys: model.PushSubscriptionKeys{
			P256dh: in.Keys.P256dh,
			Auth:   in.Keys.Auth,
		},
		// CreatedAt / UpdatedAt se setean en repo (upsert)
	}

	if err := ctl.repo.UpsertSubscriptionByEndpoint(c.Request.Context(), userID, sub); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo guardar la suscripción"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "subscription guardada"})
}

// DELETE /api/push/unsubscribe
func (ctl *PushController) Unsubscribe(c *gin.Context) {
	endpoint := c.Query("endpoint")
	if endpoint == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "endpoint requerido"})
		return
	}

	if err := ctl.repo.DeleteSubscription(c.Request.Context(), endpoint); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo eliminar la subscription"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "subscription eliminada"})
}
