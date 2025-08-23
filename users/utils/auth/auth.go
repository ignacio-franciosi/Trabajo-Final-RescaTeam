package utils

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type TokenVerificationResponse struct {
	UserID    int  `json:"id_user"`
	IsAdmin   bool `json:"type"`
	Suspended bool `json:"suspended"`
}

func VerifyTokenAndAuthorize(c *gin.Context, allowAdmin bool, allowOwner bool, reqUserId int) bool {

	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Falta el token de autorización"})
		c.Abort()
		return false
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	claims, err := verifyTokenExternally(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		c.Abort()
		return false
	}

	isOwner := claims.UserID == reqUserId

	if (allowOwner && isOwner) || (allowAdmin && claims.IsAdmin) {
		c.Set("userId", claims.UserID)
		c.Set("isAdmin", claims.IsAdmin)
		return true
	}

	//log.Debug("isOwner", isOwner)
	//log.Debug("isAdmin", claims.IsAdmin)

	c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permisos suficientes"})
	c.Abort()
	return false
}

func VerifyQueryToken(c *gin.Context) bool {
	tokenString := c.Query("token")
	if tokenString == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token faltante"})
		return false
	}

	claims, err := verifyTokenExternally(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		c.Abort()
		return false
	}

	c.Set("userId", claims.UserID)
	return true

}

func verifyTokenExternally(token string) (*TokenVerificationResponse, error) {
	//url := "https://auth-production-1ceb.up.railway.app/verify"
	//url := "http://rescateam-auth:8082/verify" // Docker
	url := "http://loaclhost:8082/verify"

	payload, _ := json.Marshal(map[string]string{
		"token": token,
	})

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(payload))
	if err != nil {
		return nil, errors.New("no se pudo contactar al servicio de autenticación")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("token inválido")
	}

	var result TokenVerificationResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, errors.New("respuesta inválida del servicio de autenticación")
	}

	return &result, nil
}
