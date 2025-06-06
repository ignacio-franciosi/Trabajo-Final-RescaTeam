package main

import (
	"auth/middleware"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	// Tu ruta POST
	r.POST("/verify", middleware.VerifyTokenHandler)

	// Obtén el puerto de la variable de entorno PORT, o usa 8080 para desarrollo local
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082" // Puerto por defecto para testing local si no hay PORT
	}

	// Asegúrate de que Gin escuche en el puerto proporcionado por Railway
	r.Run(":" + port)
}
