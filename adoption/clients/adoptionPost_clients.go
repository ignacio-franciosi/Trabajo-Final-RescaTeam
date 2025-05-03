package clients

import (
	"adoption/model"

	log "github.com/sirupsen/logrus"

	"errors"

	"gorm.io/gorm"
)

var Db *gorm.DB

func InsertAdoptionPost(adoption_posts model.AdoptionPost) model.AdoptionPost {
	result := Db.Create(&adoption_posts)

	if result.Error != nil {
		log.Error("Error creating post: ", result.Error)
	}

	log.Debug("Post Created: ", adoption_posts.AdoptionPostId)
	return adoption_posts
}

func GetAdoptionPostById(id string) model.AdoptionPost {
	var adoption_post model.AdoptionPost

	Db.Where("adoption_post_id = ?", id).First(&adoption_post)
	log.Debug("Adoption Post: ", adoption_post)

	return adoption_post
}

func DeleteAdoptionPost(adoption_posts model.AdoptionPost) error {
	err := Db.Delete(&adoption_posts).Error

	if err != nil {
		log.Debug("Failed to delete the adoption post")
	} else {
		log.Debug("Adoption post deleted: ", adoption_posts.AdoptionPostId)
	}
	return err
}

func GetAllAdoptionPosts() model.AdoptionPosts {
	var posts model.AdoptionPosts

	err := Db.Where("adoption_status = ?", false).Find(&posts).Error
	if err != nil {
		log.Error("Error fetching posts: ", err)
		return model.AdoptionPosts{}
	}

	return posts
}

func UpdateAdoptionPostById(id int, post model.AdoptionPost) (model.AdoptionPost, error) {
	var existing model.AdoptionPost

	// Buscar el post existente por ID
	if err := Db.First(&existing, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Warnf("No se encontró ningún post con ID %d", id)
			return model.AdoptionPost{}, errors.New("no se encontró el post de adopción")
		}
		log.Error("Error al buscar el post existente: ", err)
		return model.AdoptionPost{}, err
	}

	// Asignar el ID para asegurarse que se actualiza el correcto
	post.AdoptionPostId = id

	// Ejecutar la actualización
	if err := Db.Model(&existing).Updates(post).Error; err != nil {
		log.Error("Error al actualizar el post de adopción: ", err)
		return model.AdoptionPost{}, err
	}

	log.Infof("Post de adopción con ID %d actualizado correctamente", id)
	return post, nil
}
