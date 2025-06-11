package clients

import (
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
	GetPhoneByUserId(id int) model.User // TO DELETE SOON
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
			"phone":   user.Phone,
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

func (c *userClient) GetPhoneByUserId(id int) model.User {
	var user model.User
	Db.Where("user_id = ?", id).First(&user)
	log.Debug("User: ", user)

	return user
}
