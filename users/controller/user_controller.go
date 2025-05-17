package userController

import (
	"net/http"
	"strconv"
	dto "users/dto"
	service "users/services"

	"github.com/gin-gonic/gin"
	_ "github.com/golang-jwt/jwt/v4"
	log "github.com/sirupsen/logrus"
)

func GetUserByEmail(c *gin.Context) {

	email := c.Param("email")
	var userDto dto.UserDto
	userDto, err := service.UserService.GetUserByEmail(email)
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
	log.Debug("ID de usuario a cargar: " + c.Param("id"))
	id, _ := strconv.Atoi(c.Param("id"))
	var userDto dto.UserDto

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
