package controllers

import (
	"chat/clients/push"
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

	var sub model.PushSubscription
	if err := c.ShouldBindJSON(&sub); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := ctl.repo.SaveSubscription(c.Request.Context(), userID, sub); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no se pudo guardar la subscription"})
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
