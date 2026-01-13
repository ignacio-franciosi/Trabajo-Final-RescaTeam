package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"regexp"
	"time"
	userClient "users/clients/user"
	dto "users/dto"
	"users/model"
	"users/utils/queue"

	"github.com/golang-jwt/jwt/v4"
	"github.com/resend/resend-go/v2"
	"golang.org/x/crypto/bcrypt"

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
	DeleteUser(id int, requestUserId int, isAdmin bool) error
	SuspendUser(userId int) (dto.TokenDto, error)
	ReactivateUser(userId int) (dto.TokenDto, error)
	SendSuspensionNotificationEmail(userId int, reason string) error
	SendReactivationNotificationEmail(userId int) error
	SendAccountDeletionEmailWithUserData(user model.User, admin model.User) error
	GetAllSuspendedUsers() (dto.UsersDto, error)
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

// Helper function para enviar emails con Resend API
func sendEmailWithResend(to, subject, body string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	if apiKey == "" {
		log.Error("RESEND_API_KEY no configurada")
		return errors.New("RESEND_API_KEY no configurada")
	}

	client := resend.NewClient(apiKey)

	params := &resend.SendEmailRequest{
		From:    "RescaTeam <onboarding@resend.dev>",
		To:      []string{to},
		Subject: subject,
		Text:    body,
	}

	sent, err := client.Emails.Send(params)
	if err != nil {
		log.Error("Error al enviar email via Resend:", err)
		return err
	}

	log.Info("✅ Email enviado exitosamente via Resend. ID:", sent.Id, "| Destinatario:", to)
	return nil
}

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

	// Enviar email con Resend
	subject := "Recuperación de contraseña"
	body := fmt.Sprintf("Hola! Para restablecer tu contraseña, hacé clic en este enlace:\n\n%s", resetLink)

	return sendEmailWithResend(email, subject, body)
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

func (s *userService) DeleteUser(id int, requestUserId int, isAdmin bool) error {
	user := userClient.UserClient.GetUserById(id)

	if user.UserId == 0 {
		return errors.New("user not found")
	}

	// Obtener datos del admin si es necesario (antes de eliminar el usuario)
	var admin model.User
	shouldSendEmail := isAdmin && requestUserId != id
	if shouldSendEmail {
		admin = userClient.UserClient.GetUserById(requestUserId)
		if admin.UserId == 0 {
			log.Error("Admin no encontrado para envío de notificación")
			shouldSendEmail = false
		}
	}

	// Eliminar el usuario
	err := userClient.UserClient.DeleteUser(user)
	if err != nil {
		return err
	}

	// Si es admin quien elimina y no se está eliminando a sí mismo, enviar email
	if shouldSendEmail {
		err = s.SendAccountDeletionEmailWithUserData(user, admin)
		if err != nil {
			log.Error("Error al enviar notificación de eliminación de cuenta por admin:", err)
			// No retornamos error porque la eliminación ya se completó
		}
	}

	// Armo el mensaje de cola
	msg := dto.QueueMessageDto{
		Id:      user.UserId,
		Message: "delete",
	}

	body, err := json.Marshal(msg)
	if err != nil {
		return err
	}

	// Publico en la cola
	err = queue.QueueProducer.Publish(body)
	if err != nil {
		return err
	}

	return nil
}

func (s *userService) SuspendUser(userId int) (dto.TokenDto, error) {
	var tokenDto dto.TokenDto

	updatedUser, err := userClient.UserClient.SuspendUser(userId)
	if err != nil {
		return tokenDto, err
	}

	// Enviar email de forma SINCRÓNICA (producción-safe)
	reason := "Violación de los términos de servicio"
	err = s.SendSuspensionNotificationEmail(userId, reason)
	if err != nil {
		log.Error("Error al enviar notificación de suspensión:", err)
	} else {
		log.Info("Email de suspensión enviado correctamente a usuario:", userId)
	}

	// Generar nuevo token con el estado actualizado
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id_user":   updatedUser.UserId,
		"type":      updatedUser.Type,
		"suspended": updatedUser.Suspended,
	})
	tokenString, _ := token.SignedString(jwtKey)

	tokenDto.Token = tokenString
	tokenDto.UserId = updatedUser.UserId
	tokenDto.Type = updatedUser.Type
	tokenDto.Suspended = updatedUser.Suspended

	return tokenDto, nil
}

func (s *userService) ReactivateUser(userId int) (dto.TokenDto, error) {
	var tokenDto dto.TokenDto

	updatedUser, err := userClient.UserClient.ReactivateUser(userId)
	if err != nil {
		return tokenDto, err
	}

	// Enviar email de forma SINCRÓNICA (producción-safe)
	err = s.SendReactivationNotificationEmail(userId)
	if err != nil {
		log.Error("Error al enviar notificación de reactivación:", err)

	} else {
		log.Info("Email de reactivación enviado correctamente a usuario:", userId)
	}

	// Generar nuevo token con el estado actualizado
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id_user":   updatedUser.UserId,
		"type":      updatedUser.Type,
		"suspended": updatedUser.Suspended,
	})
	tokenString, _ := token.SignedString(jwtKey)

	tokenDto.Token = tokenString
	tokenDto.UserId = updatedUser.UserId
	tokenDto.Type = updatedUser.Type
	tokenDto.Suspended = updatedUser.Suspended

	return tokenDto, nil
}

func (s *userService) SendSuspensionNotificationEmail(userId int, reason string) error {
	user := userClient.UserClient.GetUserById(userId)
	if user.UserId == 0 {
		return errors.New("user not found")
	}

	// Email de suspensión
	subject := "Rescateam - Cuenta suspendida"
	body := fmt.Sprintf("Hola %s,\n\nTu cuenta ha sido suspendida por el siguiente motivo:\n%s\n\nSi consideras que esto es un error, puedes contactar con nuestro equipo de soporte.\n\nSaludos,\nEquipo de RescaTeam", user.Name, reason)

	return sendEmailWithResend(user.Email, subject, body)
}

func (s *userService) SendReactivationNotificationEmail(userId int) error {
	user := userClient.UserClient.GetUserById(userId)
	if user.UserId == 0 {
		return errors.New("user not found")
	}

	// Email de reactivación
	subject := "Rescateam - Cuenta reactivada"
	body := fmt.Sprintf("Hola %s,\n\n¡Buenas noticias! Tu cuenta ha sido reactivada y ya puedes volver a utilizar todos los servicios de RescaTeam. Te pedimos que a partir de ahora respetes las normas del sitio. \n\nGracias por tu paciencia.\n\nSaludos,\nEquipo de RescaTeam", user.Name)

	return sendEmailWithResend(user.Email, subject, body)
}

func (s *userService) SendAccountDeletionEmailWithUserData(user model.User, admin model.User) error {
	// Email de notificación de eliminación de cuenta por admin
	subject := "RescaTeam - Cuenta eliminada por administrador"
	body := fmt.Sprintf("Hola %s,\n\nTu cuenta en RescaTeam ha sido eliminada por un administrador debido a violaciones de nuestros términos de servicio.\n\nSi consideras que esto es un error, puedes contactar con nuestro equipo de soporte.\n\nSaludos,\nEquipo de RescaTeam", user.Name)

	err := sendEmailWithResend(user.Email, subject, body)
	if err != nil {
		log.Println("Error al enviar mail de eliminación de cuenta por admin:", err)
		return err
	}

	log.Printf("Email de eliminación de cuenta enviado a %s por acción del admin %s", user.Email, admin.Email)
	return nil
}

func (s *userService) GetAllSuspendedUsers() (dto.UsersDto, error) {
	var usersDto dto.UsersDto
	users, err := userClient.UserClient.GetAllSuspendedUsers()
	if err != nil {
		return usersDto, err
	}
	for _, u := range users {
		usersDto = append(usersDto, dto.UserDto{
			UserId:    u.UserId,
			Name:      u.Name,
			Surname:   u.Surname,
			Dni:       u.Dni,
			Email:     u.Email,
			Password:  u.Password,
			Type:      u.Type,
			Suspended: u.Suspended,
		})
	}
	return usersDto, nil
}
