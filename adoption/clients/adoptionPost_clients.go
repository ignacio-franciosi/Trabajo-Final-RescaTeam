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
