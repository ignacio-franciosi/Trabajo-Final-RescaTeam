package main

import (
	"chat/app"
	"log"
)

func main() {
	router := app.SetupRouter()

	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Error al iniciar servidor: %v", err)
	}
}
