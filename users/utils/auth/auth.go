package utils

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type TokenVerificationResponse struct {
	UserID    int  `json:"id_user"`
	IsAdmin   bool `json:"type"`
	Suspended bool `json:"suspended"`
}

func VerifyTokenAndAuthorize(c *gin.Context, allowAdmin bool, allowOwner bool) bool {
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

	resourceIDStr := c.Param("id")

	// Si no hay ":id" en la ruta, por ejemplo cuando se usa email, el owner check se ignora
	isOwner := false
	if resourceIDStr != "" {
		resourceID, err := strconv.Atoi(resourceIDStr)
		if err == nil {
			isOwner = claims.UserID == resourceID
		}
	}

	if (allowOwner && isOwner) || (allowAdmin && claims.IsAdmin) {
		c.Set("userId", claims.UserID)
		c.Set("isAdmin", claims.IsAdmin)
		return true
	}

	c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permisos suficientes"})
	c.Abort()
	return false
}

func verifyTokenExternally(token string) (*TokenVerificationResponse, error) {
	url := "http://localhost:8082/verify" // o http://auth:8082/verify en Docker

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
