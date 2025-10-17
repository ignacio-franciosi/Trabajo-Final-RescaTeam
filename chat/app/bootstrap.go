package app

import (
	"chat/clients/push"
	"chat/db"
	"chat/services"
	"log"
	"os"

	"github.com/gin-gonic/gin"
)

func Bootstrap() *gin.Engine {
	// 1) Env
	LoadEnv()

	// 2) Mongo (NO cerrar aquí: lo cerrará el proceso al terminar)
	client, database := db.MustConnectMongo()
	_ = client // lo mantenemos vivo durante todo el proceso

	// 3) Índices
	if err := db.EnsureIndexes(database); err != nil {
		log.Fatalf("Error creando índices: %v", err)
	}

	// 4) Repo
	repo := services.NewMongoRepository(database)

	// 5) Push (VAPID)
	vapidPub := os.Getenv("VAPID_PUBLIC_KEY")
	vapidPriv := os.Getenv("VAPID_PRIVATE_KEY")
	if vapidPub == "" || vapidPriv == "" {
		log.Fatal("Faltan VAPID_PUBLIC_KEY y/o VAPID_PRIVATE_KEY en el .env")
	}
	pushClient := push.NewPushClient(vapidPub, vapidPriv)

	// 6) Hub + Service
	hub := services.NewHub()
	chatService := services.NewChatService(repo, hub, pushClient)

	// 7) Router y rutas
	router := SetupRouter()

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("Falta JWT_SECRET en el .env")
	}
	RegisterRoutes(router, database, chatService, hub, jwtSecret)

	log.Println("[Chat] Microservicio iniciado correctamente")
	return router
}
