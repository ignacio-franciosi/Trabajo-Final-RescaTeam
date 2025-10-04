package app

import (
	"chat/controllers"
	"chat/repositories"
	"chat/services"
	"chat/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

func RegisterRoutes(r *gin.Engine, db *mongo.Database, svc *services.ChatService, hub *services.Hub, jwtSecret string) {
	auth := utils.JWT(jwtSecret)

	// Rutas públicas
	r.GET("/ping", func(c *gin.Context) { c.JSON(200, gin.H{"message": "pong"}) })
	r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })

	// WebSocket protegido con JWT
	wsCtl := controllers.NewWSController(hub, svc, jwtSecret)
	r.GET("/ws", auth, wsCtl.Upgrade)

	// Rutas REST del chat (todas requieren auth)
	chatCtl := controllers.NewChatController(svc)
	grpChat := r.Group("/api/chat", auth)
	{
		grpChat.POST("/start", chatCtl.StartChat)
		grpChat.GET("/list", chatCtl.ListChats)
		grpChat.GET("/:chatId/messages", chatCtl.ListMessages)
		grpChat.POST("/:chatId/read", chatCtl.MarkRead)
		grpChat.POST("/:chatId/send", chatCtl.SendMessageHTTP) // fallback HTTP
	}

	// Rutas Push Notifications
	pushRepo := repositories.NewPushRepository(db)
	pushCtl := controllers.NewPushController(pushRepo, svc.GetPushClient())

	// Ruta pública: clave VAPID
	r.GET("/push/public-key", pushCtl.PublicKey)

	// Rutas protegidas: suscripción/unsub
	grpPush := r.Group("/api/push", auth)
	{
		grpPush.POST("/subscribe", pushCtl.Subscribe)
		grpPush.DELETE("/unsubscribe", pushCtl.Unsubscribe)
	}
}
