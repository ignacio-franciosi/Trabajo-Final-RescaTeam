package user

import (
	"errors"
	"users/model"

	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type userClient struct{}

type userClientInterface interface {
	GetUserById(id int) model.User
	GetUserByEmail(email string) model.User
	InsertUser(user model.User) model.User
	UpdateUser(user model.User) (model.User, error)
	ChangePassword(userId int, hashedPassword string) error
	DeleteUser(user model.User) error
	SuspendUser(userId int) (model.User, error)
	ReactivateUser(userId int) (model.User, error)
	GetAllSuspendedUsers() ([]model.User, error)
}

var UserClient userClientInterface
var Db *gorm.DB

func init() {
	UserClient = &userClient{}
}

func (c *userClient) GetUserById(id int) model.User {
	var user model.User
	Db.Where("user_id = ?", id).First(&user)
	log.Debug("User: ", user)
	return user
}

func (c *userClient) GetUserByEmail(email string) model.User {
	var user model.User
	Db.Where("email = ?", email).First(&user)
	return user
}

func (c *userClient) InsertUser(user model.User) model.User {
	result := Db.Create(&user)
	if result.Error != nil {
		log.Error("Couldn't create user")
		return model.User{}
	}
	log.Debug("User Created: ", user.UserId)
	return user
}

func (c *userClient) UpdateUser(user model.User) (model.User, error) {
	result := Db.Model(&model.User{}).
		Where("user_id = ?", user.UserId).
		Updates(map[string]any{
			"name":    user.Name,
			"surname": user.Surname,
			"dni":     user.Dni,
			"email":   user.Email,
		})

	if result.Error != nil {
		return model.User{}, result.Error
	}

	var updatedUser model.User
	err := Db.Where("user_id = ?", user.UserId).First(&updatedUser).Error
	if err != nil {
		return model.User{}, err
	}

	return updatedUser, nil
}

func (c *userClient) ChangePassword(userId int, hashedPassword string) error {
	result := Db.Model(&model.User{}).
		Where("user_id = ?", userId).
		Updates(map[string]any{
			"password": hashedPassword,
		})

	if result.Error != nil {
		return result.Error
	}

	return nil
}

func (c *userClient) DeleteUser(user model.User) error {
	err := Db.Delete(&user).Error

	if err != nil {
		log.Debug("Failed to delete user")
	} else {
		log.Debug("User deleted: ", user.UserId)
	}
	return err
}


func (c *userClient) SuspendUser(userId int) (model.User, error) {
	// Primero obtenemos el usuario para verificar su estado actual
	var user model.User
	err := Db.Where("user_id = ?", userId).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("Usuario no encontrado con ID: ", userId)
			return model.User{}, errors.New("usuario no encontrado")
		}
		log.Error("Error al buscar usuario: ", err)
		return model.User{}, err
	}

	// Verificamos si ya está suspendido
	if user.Suspended {
		log.Debug("Usuario ya está suspendido: ", userId)
		return user, errors.New("el usuario ya está suspendido")
	}

	result := Db.Model(&model.User{}).
		Where("user_id = ?", userId).
		Update("suspended", true)

	if result.Error != nil {
		log.Error("Error al suspender usuario: ", result.Error)
		return model.User{}, result.Error
	}

	// Obtenemos el usuario actualizado
	err = Db.Where("user_id = ?", userId).First(&user).Error
	if err != nil {
		return model.User{}, err
	}

	log.Debug("Usuario suspendido exitosamente: ", userId)
	return user, nil
}


func (c *userClient) ReactivateUser(userId int) (model.User, error) {
	// Primero obtenemos el usuario para verificar su estado actual
	var user model.User
	err := Db.Where("user_id = ?", userId).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("Usuario no encontrado con ID: ", userId)
			return model.User{}, errors.New("usuario no encontrado")
		}
		log.Error("Error al buscar usuario: ", err)
		return model.User{}, err
	}

	// Verificamos si ya está activo (no suspendido)
	if !user.Suspended {
		log.Debug("Usuario ya está activo: ", userId)
		return user, errors.New("el usuario ya está activo")
	}

	// Actualizamos el estado de suspensión
	result := Db.Model(&model.User{}).
		Where("user_id = ?", userId).
		Update("suspended", false)

	if result.Error != nil {
		log.Error("Error al reactivar usuario: ", result.Error)
		return model.User{}, result.Error
	}

	// Obtenemos el usuario actualizado
	err = Db.Where("user_id = ?", userId).First(&user).Error
	if err != nil {
		return model.User{}, err
	}

	log.Debug("Usuario reactivado exitosamente: ", userId)
	return user, nil
}

func (c *userClient) GetAllSuspendedUsers() ([]model.User, error) {
	var users []model.User
	err := Db.Where("suspended = ?", true).Find(&users).Error
	if err != nil {
		log.Error("Error al obtener usuarios suspendidos: ", err)
		return nil, err
	}
	return users, nil
}