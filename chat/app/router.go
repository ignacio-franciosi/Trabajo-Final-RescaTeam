package app

import (
	"os"
	"strings"
	"sync"
	"time"

	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

var (
	limiters = make(map[string]*rate.Limiter)
	mu       sync.Mutex
)

// obtiene (o crea) un rate limiter por IP
func getLimiter(ip string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	limiter, exists := limiters[ip]
	if !exists {
		limiter = rate.NewLimiter(1, 50) // 1 request/segundo, burst de 50
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

	// Configuración de CORS - obtener orígenes permitidos desde variable de entorno
	allowedOrigins := []string{"http://localhost:5173"} // default para desarrollo

	// Si hay ALLOWED_ORIGINS en env, usarlos (para producción)
	if envOrigins := os.Getenv("ALLOWED_ORIGINS"); envOrigins != "" {
		origins := strings.Split(envOrigins, ",")
		allowedOrigins = []string{} // limpiar defaults
		for _, origin := range origins {
			allowedOrigins = append(allowedOrigins, strings.TrimSpace(origin))
		}
	}

	config := cors.Config{
		AllowOriginFunc: func(origin string) bool {
			// Permitir origins específicos de la lista
			for _, allowed := range allowedOrigins {
				if origin == allowed {
					return true
				}
			}
			// También permitir cualquier origin de railway.app para facilitar deploys
			if strings.HasSuffix(origin, ".railway.app") || strings.HasSuffix(origin, "railway.app") {
				return true
			}
			return false
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(config))

	// Middleware global
	router.Use(RateLimitMiddleware())

	return router
}
