package clients

import (
	"users/model"

	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

var Db *gorm.DB

func GetUserById(id int) model.User {
	var user model.User
	Db.Where("user_id = ?", id).First(&user)
	log.Debug("User: ", user)

	return user
}

func GetUserByEmail(email string) model.User {
	var user model.User
	Db.Where("email = ?", email).First(&user)
	log.Debug("User: ", user)

	return user
}

func InsertUser(user model.User) model.User {
	result := Db.Create(&user)

	if result.Error != nil {
		//TO DO Manage Errors
		log.Error("Couldn't create user")
		return model.User{}
	}
	log.Debug("User Created: ", user.UserId)

	return user
}
