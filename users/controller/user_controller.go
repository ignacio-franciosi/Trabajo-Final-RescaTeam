package userController

import (
	"net/http"
	"strconv"
	dto "users/dto"
	service "users/services"
	authhelper "users/utils/auth"

	"github.com/gin-gonic/gin"
	_ "github.com/golang-jwt/jwt/v4"
	log "github.com/sirupsen/logrus"
)

func GetUserByEmail(c *gin.Context) {
	if !authhelper.VerifyTokenAndAuthorize(c, true, true) {
		return
	}

	email := c.Param("email")
	userDto, err := service.UserService.GetUserByEmail(email)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// Obtener datos del contexto (guardados en el helper)
	tokenUserId, _ := c.Get("userId")
	isAdmin, _ := c.Get("isAdmin")

	// Verificar si es dueño o admin
	if tokenUserId.(int) != userDto.UserId && !isAdmin.(bool) {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permisos suficientes"})
		return
	}

	c.JSON(http.StatusOK, userDto)
}

func GetUserById(c *gin.Context) {
	if !authhelper.VerifyTokenAndAuthorize(c, true, true) {
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	userDto, err := service.UserService.GetUserById(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Obtener datos del contexto
	tokenUserId, _ := c.Get("userId")
	isAdmin, _ := c.Get("isAdmin")

	// Verificar si es dueño o admin
	if tokenUserId.(int) != userDto.UserId && !isAdmin.(bool) {
		c.JSON(http.StatusForbidden, gin.H{"error": "No tiene permisos suficientes"})
		return
	}

	c.JSON(http.StatusOK, userDto)
}

func Login(c *gin.Context) {
	var loginDto dto.LoginDto
	err := c.BindJSON(&loginDto)
	if err != nil {
		log.Error(err.Error())
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}

	tokenDto, er := service.UserService.Login(loginDto)
	if er != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Acceso inválido. Por favor, inténtelo otra vez."})
		return
	}
	c.JSON(http.StatusOK, tokenDto)

}

func InsertUser(c *gin.Context) {
	var userDto dto.UserDto
	err := c.BindJSON(&userDto)

	// Error Parsing json param
	if err != nil {
		log.Error(err.Error())
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}

	tokenDto, er := service.UserService.InsertUser(userDto)
	// Error del Insert
	if er != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": er.Error()})
		return
	}

	c.JSON(http.StatusCreated, tokenDto)
}

func UpdateUser(c *gin.Context) {
	var updateUserDto dto.UpdateUserDto
	err := c.BindJSON(&updateUserDto)

	// Error Parsing json param
	if err != nil {
		log.Error(err.Error())
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	updateUserDto.UserId = id

	userDto, err := service.UserService.UpdateUser(updateUserDto)
	// Error del update
	if err != nil {
		switch err.Error() {
		case "usuario no encontrado":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "ya existe otro usuario con ese email", "email inválido":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, userDto)

}

func ChangePassword(c *gin.Context) {
	var changePasswordDto dto.ChangePasswordDto
	err := c.BindJSON(&changePasswordDto)

	// Error Parsing json param
	if err != nil {
		log.Error(err.Error())
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}
	changePasswordDto.UserId = id

	err = service.UserService.ChangePassword(changePasswordDto)
	if err != nil {
		switch err.Error() {
		case "user not found":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case "invalid credentials", "la contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número", "las contraseñas nuevas no coinciden":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, "Contraseña cambiada con éxito")
}

func ForgotPassword(c *gin.Context) {
	var reqDto dto.ForgotPasswordRequestDto
	if err := c.ShouldBindJSON(&reqDto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email inválido"})
		return
	}

	err := service.UserService.SendPasswordResetEmail(reqDto.Email)
	if err != nil {
		// Agregar algun Log interno
		c.JSON(http.StatusOK, gin.H{
			"message": "Si existe una cuenta asociada a ese correo, recibirás un mail con instrucciones para restablecer tu contraseña.",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Si existe una cuenta asociada a ese correo, recibirás un mail con instrucciones para restablecer tu contraseña.",
	})
}

func ResetPassword(c *gin.Context) {
	var resetPasswordDto dto.ResetPasswordDto

	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token faltante"})
		return
	}
	resetPasswordDto.Token = token

	err := c.BindJSON(&resetPasswordDto)
	if err != nil {
		log.Error(err.Error())
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}

	err = service.UserService.ResetPassword(resetPasswordDto)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contraseña actualizada correctamente"})
}
