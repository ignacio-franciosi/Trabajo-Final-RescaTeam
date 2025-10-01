package app

import (
	"chat/clients/push"
	"chat/db"
	"chat/services"
	"context"
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func Bootstrap() *gin.Engine {
	// 1. Cargar variables de entorno
	LoadEnv()

	// 2. Conexión a MongoDB
	client, database := db.MustConnectMongo()
	defer client.Disconnect(context.Background())

	// 3. Crear índices
	if err := db.EnsureIndexes(database); err != nil {
		log.Fatalf("Error creando índices: %v", err)
	}

	// 4. Repositorio Mongo
	repo := services.NewMongoRepository(database)

	// 5. PushClient con VAPID
	vapidPub := os.Getenv("VAPID_PUBLIC_KEY")
	vapidPriv := os.Getenv("VAPID_PRIVATE_KEY")
	if vapidPub == "" || vapidPriv == "" {
		log.Fatal("Faltan VAPID_PUBLIC_KEY y/o VAPID_PRIVATE_KEY en el .env")
	}
	pushClient := push.NewPushClient(vapidPub, vapidPriv, repo)

	// 6. ChatService
	chatService := services.NewChatService(repo, pushClient)

	// 7. Hub (WebSockets)
	hub := services.NewHub()
	go hub.Run()

	// 8. Router y rutas
	router := SetupRouter()
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "changeme"
	}
	RegisterRoutes(router, chatService, hub, jwtSecret)

	return router
}
