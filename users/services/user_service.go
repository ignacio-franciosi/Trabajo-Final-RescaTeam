package services

import (
	"errors"
	"regexp"
	userClient "users/clients"
	dto "users/dto"
	"users/model"

	"golang.org/x/crypto/bcrypt"

	"github.com/golang-jwt/jwt/v4"

	log "github.com/sirupsen/logrus"
)

type userService struct{}

type userServiceInterface interface {
	GetUserById(id int) (dto.UserDto, error)
	Login(loginDto dto.LoginDto) (dto.TokenDto, error)
	InsertUser(userDto dto.UserDto) (dto.TokenDto, error)
	GetUserByEmail(email string) (dto.UserDto, error)
	UpdateUser(userDto dto.UserDto) (dto.UserDto, error)
}

var (
	UserService userServiceInterface
)

func init() {
	UserService = &userService{}
}

func (s *userService) GetUserById(id int) (dto.UserDto, error) {

	var user model.User = userClient.GetUserById(id)
	var userDto dto.UserDto

	if user.UserId == 0 {
		return userDto, errors.New("user not found")
	}
	userDto.UserId = user.UserId
	userDto.Name = user.Name
	userDto.Surname = user.Surname
	userDto.Dni = user.Dni
	userDto.Email = user.Email
	userDto.Password = user.Password
	userDto.Type = user.Type
	userDto.Suspended = user.Suspended

	return userDto, nil
}

func (s *userService) GetUserByEmail(email string) (dto.UserDto, error) {

	var user model.User = userClient.GetUserByEmail(email)
	var userDto dto.UserDto

	if user.UserId == 0 {
		return userDto, errors.New("user not found")
	}
	userDto.UserId = user.UserId
	userDto.Name = user.Name
	userDto.Surname = user.Surname
	userDto.Dni = user.Dni
	userDto.Email = user.Email
	userDto.Password = user.Password
	userDto.Type = user.Type
	userDto.Suspended = user.Suspended

	return userDto, nil
}

// login
var jwtKey = []byte("secret_key")

func (s *userService) Login(loginDto dto.LoginDto) (dto.TokenDto, error) {

	log.Debug(loginDto)
	var user model.User = userClient.GetUserByEmail(loginDto.Email)
	var tokenDto dto.TokenDto

	if user.UserId == 0 {
		return tokenDto, errors.New("invalid credentials")
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginDto.Password))
	if err != nil {
		return tokenDto, errors.New("invalid credentials")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id_user":   user.UserId,
		"type":      user.Type,
		"suspended": user.Suspended,
	})
	tokenString, _ := token.SignedString(jwtKey)
	tokenDto.Token = tokenString
	tokenDto.UserId = user.UserId
	tokenDto.Type = user.Type
	tokenDto.Suspended = user.Suspended

	return tokenDto, nil

}

func (s *userService) InsertUser(userDto dto.UserDto) (dto.TokenDto, error) {

	var user model.User
	var tokenDto dto.TokenDto

	if userDto.Name == "" || userDto.Surname == "" || userDto.Email == "" || userDto.Password == "" {
		return tokenDto, errors.New("todos los campos son obligatorios")
	}

	matched, _ := regexp.MatchString(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$`, userDto.Email)
	if !matched {
		return tokenDto, errors.New("email inválido")
	}

	if len(userDto.Password) < 8 ||
		!regexp.MustCompile(`[A-Z]`).MatchString(userDto.Password) ||
		!regexp.MustCompile(`[a-z]`).MatchString(userDto.Password) ||
		!regexp.MustCompile(`[0-9]`).MatchString(userDto.Password) {
		return tokenDto, errors.New("la contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
	}

	if userDto.Dni <= 0 {
		return tokenDto, errors.New("el DNI es obligatorio y debe ser un número válido")
	}

	existingUser := userClient.GetUserByEmail(userDto.Email)
	if existingUser.UserId != 0 {
		return tokenDto, errors.New("ya existe un usuario con ese email")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(userDto.Password), bcrypt.DefaultCost)
	if err != nil {
		return tokenDto, errors.New("error al encriptar la contraseña")
	}

	user.Name = userDto.Name
	user.Surname = userDto.Surname
	user.Dni = userDto.Dni
	user.Email = userDto.Email
	user.Password = string(hashedPassword)
	user.Type = userDto.Type
	user.Suspended = userDto.Suspended

	user = userClient.InsertUser(user)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id_user":   user.UserId,
		"type":      user.Type,
		"suspended": user.Suspended,
	})

	// Firmamos el token
	tokenString, _ := token.SignedString(jwtKey)
	tokenDto.Token = tokenString
	tokenDto.UserId = user.UserId
	tokenDto.Type = user.Type
	tokenDto.Suspended = user.Suspended

	return tokenDto, nil

}

func (s *userService) UpdateUser(userDto dto.UserDto) (dto.UserDto, error) {

	var updatedUserDto dto.UserDto
	existingUser := userClient.GetUserById(userDto.UserId)
	if existingUser.UserId == 0 {
		return updatedUserDto, errors.New("usuario no encontrado")
	}

	// Actualizar el nombre si viene
	if userDto.Name != "" {
		existingUser.Name = userDto.Name
	}

	// Actualizar el apellido si viene
	if userDto.Surname != "" {
		existingUser.Surname = userDto.Surname
	}

	// Actualizar el email si viene
	if userDto.Email != "" {
		// Validar formato
		matched, _ := regexp.MatchString(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$`, userDto.Email)
		if !matched {
			return updatedUserDto, errors.New("email inválido")
		}

		// Verificar que no esté en uso por otro
		otherUser := userClient.GetUserByEmail(userDto.Email)
		if otherUser.UserId != 0 && otherUser.UserId != userDto.UserId {
			return updatedUserDto, errors.New("ya existe otro usuario con ese email")
		}

		existingUser.Email = userDto.Email
	}

	// Persistir cambios
	err := userClient.UpdateUser(existingUser)
	if err != nil {
		return updatedUserDto, errors.New("error al actualizar el usuario: " + err.Error())
	}

	updatedUserDto.UserId = user.UserId
	updatedUserDto.Name = user.Name
	updatedUserDto.Surname = user.Surname
	updatedUserDto.Dni = user.Dni
	updatedUserDto.Email = user.Email
	updatedUserDto.Password = user.Password
	updatedUserDto.Type = user.Type
	updatedUserDto.Suspended = user.Suspended

	return updatedUserDto, nil

}
