package services

import (
	"crypto/md5"
	"encoding/hex"
	"errors"
	userClient "users/clients"
	dto "users/dto"
	"users/model"

	"github.com/dgrijalva/jwt-go"

	log "github.com/sirupsen/logrus"
)

type userService struct{}

type userServiceInterface interface {
	GetUserById(id int) (dto.UserDto, error)
	Login(loginDto dto.LoginDto) (dto.TokenDto, error)
	InsertUser(userDto dto.UserDto) (dto.TokenDto, error)
	GetUserByEmail(email string) (dto.UserDto, error)
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

	if user.Email == "" {
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

	log.Debug(loginDto) //para registrar el contenido de loginDto
	var user model.User = userClient.GetUserByEmail(loginDto.Email)
	var tokenDto dto.TokenDto

	if user.UserId == 0 {
		return tokenDto, errors.New("user not found")
	}

	//pasamos password como slice de bytes
	//hashea con md5.sum
	var pswMd5 = md5.Sum([]byte(loginDto.Password))
	//convertir a cadena hexadecimal
	pswMd5String := hex.EncodeToString(pswMd5[:])

	if pswMd5String == user.Password {
		//se firma el token para verificar autenticidad
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"id_user": user.UserId,
		})
		tokenString, _ := token.SignedString(jwtKey)
		tokenDto.Token = tokenString
		tokenDto.UserId = user.UserId
		tokenDto.Type = user.Type
		tokenDto.Suspended = user.Suspended

		return tokenDto, nil
	} else {
		return tokenDto, errors.New("incorrect password")
	}

}

func (s *userService) InsertUser(userDto dto.UserDto) (dto.TokenDto, error) {
	log.Debug(userDto) // Para registrar el contenido de userDto

	var user model.User
	var tokenDto dto.TokenDto

	if user.UserId == 0 { // El usuario no está registrado y puedo crear uno nuevo
		// Pasamos la contraseña como slice de bytes
		// Hash con md5.Sum
		var pswMd5 = md5.Sum([]byte(userDto.Password))
		// Convertir a cadena hexadecimal
		pswMd5String := hex.EncodeToString(pswMd5[:])

		// Asignamos valores al usuario antes de generar el token
		user.Name = userDto.Name
		user.Surname = userDto.Surname
		user.Dni = userDto.Dni
		user.Email = userDto.Email
		user.Password = pswMd5String
		user.Type = userDto.Type
		user.Suspended = userDto.Suspended

		// Insertamos el usuario en la base de datos
		user = userClient.InsertUser(user)

		// Ahora, después de asignar el ID del usuario, generamos el token
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"id_user": user.UserId,
			"tipo":    user.Type,
		})

		// Firmamos el token
		tokenString, _ := token.SignedString(jwtKey)
		tokenDto.Token = tokenString
		tokenDto.UserId = user.UserId
		tokenDto.Type = user.Type

		return tokenDto, nil

	} else { // El usuario ya existe
		return tokenDto, errors.New("usuario ya existe")
	}
}
