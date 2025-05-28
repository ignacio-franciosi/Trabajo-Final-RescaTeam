package services

import (
	"errors"
	"fmt"
	"net/smtp"
	"os"
	"regexp"
	"time"
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
	UpdateUser(updateUserDto dto.UpdateUserDto) (dto.UserDto, error)
	ChangePassword(changePasswordDto dto.ChangePasswordDto) error
	SendPasswordResetEmail(email string) error
	ResetPassword(tokenUserId int, resetPasswordDto dto.ResetPasswordDto) error
	DeleteUser(id int) error
}

var (
	UserService userServiceInterface
)

func init() {
	UserService = &userService{}
}

func (s *userService) GetUserById(id int) (dto.UserDto, error) {

	var user model.User = userClient.UserClient.GetUserById(id)
	var userDto dto.UserDto

	if user.UserId == 0 {
		return userDto, errors.New("user not found")
	}
	userDto.UserId = user.UserId
	userDto.Name = user.Name
	userDto.Surname = user.Surname
	userDto.Dni = user.Dni
	userDto.Email = user.Email
	userDto.Phone = user.Phone
	userDto.Password = user.Password
	userDto.Type = user.Type
	userDto.Suspended = user.Suspended

	return userDto, nil
}

func (s *userService) GetUserByEmail(email string) (dto.UserDto, error) {

	var user model.User = userClient.UserClient.GetUserByEmail(email)
	var userDto dto.UserDto

	if user.UserId == 0 {
		return userDto, errors.New("user not found")
	}
	userDto.UserId = user.UserId
	userDto.Name = user.Name
	userDto.Surname = user.Surname
	userDto.Dni = user.Dni
	userDto.Email = user.Email
	userDto.Phone = user.Phone
	userDto.Password = user.Password
	userDto.Type = user.Type
	userDto.Suspended = user.Suspended

	return userDto, nil
}

// login
var jwtKey = []byte("secret_key")

func (s *userService) Login(loginDto dto.LoginDto) (dto.TokenDto, error) {

	log.Debug(loginDto)
	var user model.User = userClient.UserClient.GetUserByEmail(loginDto.Email)
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

	existingUser := userClient.UserClient.GetUserByEmail(userDto.Email)
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
	user.Phone = userDto.Phone
	user.Password = string(hashedPassword)
	user.Type = userDto.Type
	user.Suspended = userDto.Suspended

	user = userClient.UserClient.InsertUser(user)

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

func (s *userService) UpdateUser(updateUserDto dto.UpdateUserDto) (dto.UserDto, error) {

	var userDto dto.UserDto

	existingUser := userClient.UserClient.GetUserById(updateUserDto.UserId)

	if existingUser.UserId == 0 {
		return userDto, errors.New("usuario no encontrado")
	}

	if updateUserDto.Name != "" {
		existingUser.Name = updateUserDto.Name
	}

	if updateUserDto.Surname != "" {
		existingUser.Surname = updateUserDto.Surname
	}

	if updateUserDto.Phone != "" {
		existingUser.Phone = updateUserDto.Phone
	}

	if updateUserDto.Dni != 0 {
		existingUser.Dni = updateUserDto.Dni
	}

	if updateUserDto.Email != "" {
		matched, _ := regexp.MatchString(`^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$`, updateUserDto.Email)
		if !matched {
			return userDto, errors.New("email inválido")
		}

		otherUser := userClient.UserClient.GetUserByEmail(updateUserDto.Email)
		if otherUser.UserId != 0 && otherUser.UserId != updateUserDto.UserId {
			return userDto, errors.New("ya existe otro usuario con ese email")
		}

		existingUser.Email = updateUserDto.Email
	}

	updatedUser, err := userClient.UserClient.UpdateUser(existingUser)
	if err != nil {
		return userDto, errors.New("error al actualizar el usuario: " + err.Error())
	}

	userDto.UserId = updatedUser.UserId
	userDto.Name = updatedUser.Name
	userDto.Surname = updatedUser.Surname
	userDto.Dni = updatedUser.Dni
	userDto.Email = updatedUser.Email
	userDto.Phone = updateUserDto.Phone
	userDto.Password = updatedUser.Password
	userDto.Type = updatedUser.Type
	userDto.Suspended = updatedUser.Suspended

	return userDto, nil

}

func (s *userService) ChangePassword(changePasswordDto dto.ChangePasswordDto) error {

	// check if input password is the same as the one in the database
	var user model.User = userClient.UserClient.GetUserById(changePasswordDto.UserId)
	if user.UserId == 0 {
		return errors.New("user not found")
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(changePasswordDto.OldPassword))
	if err != nil {
		return errors.New("invalid credentials")
	}

	//check if new password1 is valid
	if len(changePasswordDto.NewPassword1) < 8 ||
		!regexp.MustCompile(`[A-Z]`).MatchString(changePasswordDto.NewPassword1) ||
		!regexp.MustCompile(`[a-z]`).MatchString(changePasswordDto.NewPassword1) ||
		!regexp.MustCompile(`[0-9]`).MatchString(changePasswordDto.NewPassword1) {
		return errors.New("la contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
	}

	// check if the 2 input new passwords are the same
	if changePasswordDto.NewPassword1 != changePasswordDto.NewPassword2 {
		return errors.New("las contraseñas nuevas no coinciden")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(changePasswordDto.NewPassword1), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("error al encriptar la contraseña")
	}

	err = userClient.UserClient.ChangePassword(changePasswordDto.UserId, string(hashedPassword))
	if err != nil {
		return errors.New("error al cambiar la contraseña" + err.Error())
	}

	return nil
}

var smtpServer = "smtp.gmail.com"
var smtpPort = "587"

func (s *userService) SendPasswordResetEmail(email string) error {

	user := userClient.UserClient.GetUserByEmail(email)
	if user.UserId == 0 {
		return errors.New("user not found")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id_user":   user.UserId,
		"type":      user.Type,
		"suspended": user.Suspended,
		"exp":       time.Now().Add(10 * time.Minute).Unix(), //token válido por 10 mins
	})
	tokenStr, err := token.SignedString(jwtKey)
	if err != nil {
		return err
	}

	frontendURL := os.Getenv("FRONTEND_BASE_URL")                                 // ej: http://localhost:5173
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", frontendURL, tokenStr) // despues, url de front

	// Email
	subject := "Subject: Recuperación de contraseña\n"
	body := fmt.Sprintf("Hola! Para restablecer tu contraseña, hacé clic en este enlace:\n\n%s", resetLink)
	msg := []byte(subject + "\n" + body)

	from := os.Getenv("MAIL_USER")
	pass := os.Getenv("MAIL_PASS")

	auth := smtp.PlainAuth("", from, pass, smtpServer)
	err = smtp.SendMail(smtpServer+":"+smtpPort, auth, from, []string{email}, msg)
	if err != nil {
		log.Println("Error al enviar mail:", err)
		return err
	}

	return nil
}

func (s *userService) ResetPassword(tokenUserId int, resetPasswordDto dto.ResetPasswordDto) error {
	var user model.User = userClient.UserClient.GetUserById(tokenUserId)

	if user.UserId == 0 {
		return errors.New("user not found")
	}

	//check if new password1 is valid
	if len(resetPasswordDto.NewPassword1) < 8 ||
		!regexp.MustCompile(`[A-Z]`).MatchString(resetPasswordDto.NewPassword1) ||
		!regexp.MustCompile(`[a-z]`).MatchString(resetPasswordDto.NewPassword1) ||
		!regexp.MustCompile(`[0-9]`).MatchString(resetPasswordDto.NewPassword1) {
		return errors.New("la contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
	}

	// check if the 2 input new passwords are the same
	if resetPasswordDto.NewPassword1 != resetPasswordDto.NewPassword2 {
		return errors.New("las contraseñas nuevas no coinciden")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(resetPasswordDto.NewPassword1), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("error al encriptar la contraseña")
	}

	err = userClient.UserClient.ChangePassword(tokenUserId, string(hashedPassword))
	if err != nil {
		return errors.New("error al cambiar la contraseña" + err.Error())
	}

	return nil
}

func (s *userService) DeleteUser(id int) error {
	user := userClient.UserClient.GetUserById(id)

	if user.UserId == 0 {
		return errors.New("user not found")
	}

	err := userClient.UserClient.DeleteUser(user)

	return err
}
