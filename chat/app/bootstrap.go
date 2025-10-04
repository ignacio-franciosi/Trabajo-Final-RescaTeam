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
	defer func() {
		if err := client.Disconnect(context.Background()); err != nil {
			log.Printf("Error cerrando conexión MongoDB: %v", err)
		}
	}()

	// 3. Crear índices
	if err := db.EnsureIndexes(database); err != nil {
		log.Fatalf("Error creando índices: %v", err)
	}

	// 4. Repositorio Mongo
	repo := services.NewMongoRepository(database)

	// 5. PushClient con claves VAPID
	vapidPub := os.Getenv("VAPID_PUBLIC_KEY")
	vapidPriv := os.Getenv("VAPID_PRIVATE_KEY")
	if vapidPub == "" || vapidPriv == "" {
		log.Fatal("Faltan VAPID_PUBLIC_KEY y/o VAPID_PRIVATE_KEY en el .env")
	}
	pushClient := push.NewPushClient(vapidPub, vapidPriv)

	// 6. Hub (maneja conexiones WebSocket)
	hub := services.NewHub()

	// 7. ChatService (inyectamos repo, hub, pushClient)
	chatService := services.NewChatService(repo, hub, pushClient)

	// 8. Router principal
	router := SetupRouter()

	// 9. JWT Secret (debe coincidir con el microservicio AUTH)
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("Falta JWT_SECRET en el .env")
	}

	// 10. Registrar rutas
	RegisterRoutes(router, database, chatService, hub, jwtSecret)

	log.Println("[Chat] Microservicio iniciado correctamente")
	return router
}
