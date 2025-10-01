package userController

import (
	"net/http"
	"strconv"
	dto "users/dto"
	service "users/services/user"
	authhelper "users/utils/auth"

	"github.com/gin-gonic/gin"
	_ "github.com/golang-jwt/jwt/v4"
	log "github.com/sirupsen/logrus"
)

func GetUserByEmail(c *gin.Context) {

	email := c.Param("email")
	userDto, err := service.UserService.GetUserByEmail(email)

	if !authhelper.VerifyTokenAndAuthorize(c, true, true, userDto.UserId) {
		return
	}

	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, userDto)
}

func GetUserById(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if !authhelper.VerifyTokenAndAuthorize(c, true, true, id) {
		return
	}

	userDto, err := service.UserService.GetUserById(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
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

	if !authhelper.VerifyTokenAndAuthorize(c, false, true, id) {
		return
	}

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

	if !authhelper.VerifyTokenAndAuthorize(c, false, true, id) {
		return
	}

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
	tokenString := c.Query("token")
	if tokenString == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token faltante"})
	}

	if !authhelper.VerifyQueryToken(c) {
		return
	}
	resetPasswordDto.Token = tokenString

	err := c.BindJSON(&resetPasswordDto)
	if err != nil {
		log.Error(err.Error())
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}

	userId, _ := c.Get("userId")

	err = service.UserService.ResetPassword(userId.(int), resetPasswordDto)

	if err != nil {
		// manage different errors
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Contraseña actualizada correctamente"})
}

func DeleteUser(c *gin.Context) {

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if !authhelper.VerifyTokenAndAuthorize(c, true, true, id) {
		return
	}

	// Obtener información del usuario que realiza la acción
	requestUserId, _ := c.Get("userId")
	isAdmin, _ := c.Get("isAdmin")
	
	// Pasar toda la información al servicio para que maneje internamente el envío de email
	err = service.UserService.DeleteUser(id, requestUserId.(int), isAdmin.(bool))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cuenta eliminada con éxito"})
}

func SuspendUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Solo admin puede suspender
	if !authhelper.VerifyTokenAndAuthorize(c, true, false, id) {
		return
	}

	userDto, err := service.UserService.SuspendUser(id)
	if err != nil {
		switch err.Error() {
		case "usuario no encontrado":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, userDto)
}

func ReactivateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Solo admin puede reactivar
	if !authhelper.VerifyTokenAndAuthorize(c, true, false, id) {
		return
	}

	userDto, err := service.UserService.ReactivateUser(id)
	if err != nil {
		switch err.Error() {
		case "usuario no encontrado":
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, userDto)
}