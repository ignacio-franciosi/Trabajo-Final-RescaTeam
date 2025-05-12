package authMiddleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	jwt "github.com/golang-jwt/jwt/v4"
)

var jwtKey = []byte("secret_key") // debería venir de env en prod

// CustomClaims define lo que vas a extraer del token
type CustomClaims struct {
	UserId    int  `json:"id_user"`
	Type      bool `json:"type"`      // true = admin
	Suspended bool `json:"suspended"` // true = suspendido
	jwt.RegisteredClaims
}

// Función para parsear el token y devolver los claims
func ParseToken(tokenString string) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	} else {
		return nil, errors.New("invalid token claims")
	}
}

// Middleware general: solo usuario autenticado
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := extractToken(c)
		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid Authorization header"})
			return
		}

		claims, err := ParseToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		if claims.Suspended {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Account suspended"})
			return
		}

		// Guardar claims en el contexto para usar en el handler
		c.Set("claims", claims)
		c.Next()
	}
}

// Middleware solo para admins
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := extractToken(c)
		if tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid Authorization header"})
			return
		}

		claims, err := ParseToken(tokenStr)
		if err != nil || !claims.Type {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			return
		}

		if claims.Suspended {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Account suspended"})
			return
		}

		c.Set("claims", claims)
		c.Next()
	}
}

// Extrae el token del header Authorization
func extractToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		return strings.TrimPrefix(authHeader, "Bearer ")
	}
	return ""
}
