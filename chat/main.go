package main

import (
	"chat/app"
	"chat/db"
	"chat/services"
	"context"
	"log"
	"os"
)

func main() {
	// 1. Cargar variables de entorno
	app.LoadEnv()

	// 2. Conexión a MongoDB
	client, database := db.MustConnectMongo()
	defer client.Disconnect(context.Background())

	if err := db.EnsureIndexes(database); err != nil {
		log.Fatalf("Error creando índices: %v", err)
	}

	// 3. Inicializar servicios
	chatService := services.NewChatService(client)
	hub := services.NewHub()
	go hub.Run()

	// 4. Configurar router y registrar rutas
	router := app.SetupRouter()
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "changeme" // valor por defecto
	}
	app.RegisterRoutes(router, chatService, hub, jwtSecret)

	// 5. Iniciar servidor
	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
	}
	log.Printf("Servidor corriendo en puerto %s 🚀", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Error al iniciar servidor: %v", err)
	}
}
