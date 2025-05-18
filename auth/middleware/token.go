package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

var jwtKey = []byte("secret_key") // misma clave que users

type TokenRequest struct {
	Token string `json:"token"`
}

func VerifyTokenHandler(c *gin.Context) {
	var req TokenRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "token inválido"})
		return
	}

	token, err := jwt.Parse(req.Token, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return jwtKey, nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "token no válido"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "token inválido"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id_user":   claims["id_user"],
		"type":      claims["type"],
		"suspended": claims["suspended"],
	})
}
