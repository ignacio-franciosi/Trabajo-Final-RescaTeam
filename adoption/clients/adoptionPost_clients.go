package clients

import (
	"adoption/model"

	log "github.com/sirupsen/logrus"
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
