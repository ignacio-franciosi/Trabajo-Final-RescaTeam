// chat/app/router.go
package app

import (
	"chat/controllers"
	"net/http"
	"sync"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

var (
	// Mapa de limitadores por IP
	limiters = make(map[string]*rate.Limiter)
	mu       sync.Mutex
)

// obtiene (o crea) un rate limiter por IP
func getLimiter(ip string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	limiter, exists := limiters[ip]
	if !exists {
		limiter = rate.NewLimiter(1, 50) // 1 request cada 1s, burst de 50
		limiters[ip] = limiter
	}
	return limiter
}

// middleware de rate limiting
func RateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := getLimiter(ip)

		if !limiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests, try again later.",
			})
			return
		}

		c.Next()
	}
}

func SetupRouter() *gin.Engine {
	router := gin.Default()

	// Configuración de CORS
	config := cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Vite
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(config))

	// Middleware de rate limit
	router.Use(RateLimitMiddleware())

	// Rutas de prueba
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// Rutas del chat
	api := router.Group("/api")
	{
		api.GET("/ws", controllers.HandleWebSocket) // conexión websocket
		api.POST("/message", controllers.SendMessage)
	}

	return router
}
