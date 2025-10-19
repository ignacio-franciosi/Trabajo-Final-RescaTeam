package utils

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// JWT genera un middleware que valida tokens usando la misma secret key que AUTH
func JWT(secret string) gin.HandlerFunc {
	if secret == "" {
		secret = os.Getenv("JWT_SECRET")
		if secret == "" {
			panic("JWT_SECRET no configurada")
		}
	}

	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token faltante"})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token no válido"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token inválido"})
			return
		}

		// Extraer el campo id_user (según AUTH)
		/*
			if idVal, ok := claims["id_user"]; ok {
				switch v := idVal.(type) {
				case float64:
					c.Set("userId", int(v))
				case int:
					c.Set("userId", v)
				case string:
					c.Set("userId", v)
				default:
					c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "tipo de id_user inválido"})
					return
				}
			} else {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token sin id_user"})
				return
			}
		*/

		// Normalizamos id_user a string, venga como número o string
		if idVal, ok := claims["id_user"]; ok {
			c.Set("userId", fmt.Sprint(idVal)) // <- SIEMPRE string
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "token sin id_user"})
			return
		}

		c.Next()
	}
}

func ParseUserIDFromToken(tokenStr string, secret string) (string, error) {
	if tokenStr == "" {
		return "", errors.New("empty token")
	}
	if secret == "" {
		secret = os.Getenv("JWT_SECRET")
		if secret == "" {
			return "", errors.New("JWT_SECRET not set")
		}
	}

	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return "", errors.New("invalid token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid claims")
	}

	idVal, ok := claims["id_user"]
	if !ok {
		return "", errors.New("id_user not found")
	}

	switch v := idVal.(type) {
	case string:
		return v, nil
	case float64:
		return strconv.Itoa(int(v)), nil
	default:
		return "", errors.New("id_user type not supported")
	}
}
