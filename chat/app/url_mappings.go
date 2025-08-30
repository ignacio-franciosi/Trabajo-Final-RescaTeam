package app

import (
	"chat/controllers"
	"chat/services"
	"chat/utils"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine, svc *services.ChatService, hub *services.Hub, jwtSecret string) {
	auth := utils.JWT(jwtSecret)

	// Rutas públicas
	r.GET("/ping", func(c *gin.Context) { c.JSON(200, gin.H{"message": "pong"}) })
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })

	// WebSocket protegido con JWT
	wsCtl := controllers.NewWSController(hub, svc, jwtSecret)
	r.GET("/ws", auth, wsCtl.Upgrade)

	// Rutas REST del chat (todas requieren auth)
	ctl := controllers.NewChatController(svc)
	grp := r.Group("/api/chat", auth)
	{
		grp.POST("/start", ctl.StartChat)
		grp.GET("/list", ctl.ListChats)
		grp.GET("/:chatId/messages", ctl.ListMessages)
		grp.POST("/:chatId/read", ctl.MarkRead)
		grp.POST("/:chatId/send", ctl.SendMessageHTTP) // fallback HTTP
	}
}
