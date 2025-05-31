package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type TokenRequest struct {
	Token string `json:"token"`
}

type TokenData struct {
	IdUser    int  `json:"id_user"` // Cambiado a int
	Type      bool `json:"type"`    // Cambiado a bool (ya que el auth devuelve true/false)
	Suspended bool `json:"suspended"`
}

func VerifyTokenAndAuthorize(c *gin.Context, allowAdmin bool, allowOwner bool) (bool, int, bool) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token requerido"})
		return false, 0, false
	}

	// Remover prefijo "Bearer "
	token := strings.TrimPrefix(authHeader, "Bearer ")
	token = strings.TrimSpace(token)

	// Agregar logs de depuración
	fmt.Println("===> Enviando token al servicio auth:", token)

	reqBody, _ := json.Marshal(TokenRequest{Token: token})

	authUrl := "http://localhost:8082/verify"
	//authUrl := "http://rescateam-auth:8082/verify" //docker
	resp, err := http.Post(authUrl, "application/json", bytes.NewBuffer(reqBody))
	if err != nil {
		fmt.Println("===> Error al llamar al auth:", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
		return false, 0, false
	}
	defer resp.Body.Close()

	// Leer body crudo en caso de error
	bodyBytes, _ := io.ReadAll(resp.Body)
	fmt.Println("===> Respuesta cruda del auth:", string(bodyBytes))

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
		return false, 0, false
	}

	var tokenData TokenData
	if err := json.Unmarshal(bodyBytes, &tokenData); err != nil {
		fmt.Println("===> Error al parsear JSON:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error procesando respuesta del auth"})
		return false, 0, false
	}

	if tokenData.Suspended {
		c.JSON(http.StatusForbidden, gin.H{"error": "Usuario suspendido"})
		return false, 0, false
	}

	fmt.Printf("===> Datos del token: %+v\n", tokenData)

	return true, tokenData.IdUser, tokenData.Type
}
