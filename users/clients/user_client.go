package clients

import (
	"errors"
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
	//log.Debug("User: ", user)

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

func UpdateUser(user model.User) (model.User, error) {
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

	if result.RowsAffected == 0 {
		return model.User{}, errors.New("los datos ingresados son iguales a los preexistentes")
	}

	var updatedUser model.User
	err := Db.Where("user_id = ?", user.UserId).First(&updatedUser).Error
	if err != nil {
		return model.User{}, err
	}

	return updatedUser, nil
}

func ChangePassword(userId int, hashedPassword string) error {
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

func DeleteUser(user model.User) error {
	err := Db.Delete(&user).Error

	if err != nil {
		log.Debug("Failed to delete user")
	} else {
		log.Debug("User deleted: ", user.UserId)
	}
	return err
}
