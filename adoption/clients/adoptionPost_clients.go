package clients

import (
	"errors"

	"adoption/model"

	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type adoptionPostClient struct{}

type adoptionPostClientInterface interface {
	InsertAdoptionPost(adoptionPost model.AdoptionPost) model.AdoptionPost
	GetAdoptionPostById(id int) model.AdoptionPost
	DeleteAdoptionPost(adoptionPost model.AdoptionPost) error
	GetAllAdoptionPosts() model.AdoptionPosts
	UpdateAdoptionPostById(id int, post model.AdoptionPost) (model.AdoptionPost, error)
	GetFilteredAdoptionPosts(filters map[string]string) ([]model.AdoptionPost, error)
	MarkAdoptionPostAsAdopted(id int) error
	GetAllAdoptionPostsByUserId(userId int) model.AdoptionPosts
	UploadAdoptionImage(image model.AdoptionImage) (model.AdoptionImage, error)
	GetImagesByAdoptionPostId(postId int) ([]model.AdoptionImage, error)
	GetImageById(id int) model.AdoptionImage
	DeleteImageById(imageId int) error
	DeleteAllImagesByAdoptionPostId(postId int) error
}

var AdoptionPostClient adoptionPostClientInterface
var Db *gorm.DB

func init() {
	AdoptionPostClient = &adoptionPostClient{}
}

func (c *adoptionPostClient) InsertAdoptionPost(adoptionPost model.AdoptionPost) model.AdoptionPost {
	result := Db.Create(&adoptionPost)
	if result.Error != nil {
		log.Error("Error creating post: ", result.Error)
	}
	log.Debug("Post Created: ", adoptionPost.AdoptionPostId)
	return adoptionPost
}

func (c *adoptionPostClient) GetAdoptionPostById(id int) model.AdoptionPost {
	var adoptionPost model.AdoptionPost
	Db.Where("adoption_post_id = ?", id).First(&adoptionPost)
	log.Debug("Adoption Post: ", adoptionPost)
	return adoptionPost
}

func (c *adoptionPostClient) DeleteAdoptionPost(adoptionPost model.AdoptionPost) error {
	err := Db.Delete(&adoptionPost).Error
	if err != nil {
		log.Debug("Failed to delete the adoption post")
	} else {
		log.Debug("Adoption post deleted: ", adoptionPost.AdoptionPostId)
	}
	return err
}

func (c *adoptionPostClient) GetAllAdoptionPosts() model.AdoptionPosts {
	var posts model.AdoptionPosts
	err := Db.Where("adoption_status = ?", false).Find(&posts).Error
	if err != nil {
		log.Error("Error fetching posts: ", err)
		return model.AdoptionPosts{}
	}
	return posts
}

func (c *adoptionPostClient) UpdateAdoptionPostById(id int, post model.AdoptionPost) (model.AdoptionPost, error) {
	var existing model.AdoptionPost
	if err := Db.First(&existing, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Warnf("No se encontró ningún post con ID %d", id)
			return model.AdoptionPost{}, errors.New("no se encontró el post de adopción")
		}
		log.Error("Error al buscar el post existente: ", err)
		return model.AdoptionPost{}, err
	}
	post.AdoptionPostId = id
	if err := Db.Model(&existing).Updates(post).Error; err != nil {
		log.Error("Error al actualizar el post de adopción: ", err)
		return model.AdoptionPost{}, err
	}
	log.Infof("Post de adopción con ID %d actualizado correctamente", id)
	return post, nil
}

func (c *adoptionPostClient) GetFilteredAdoptionPosts(filters map[string]string) ([]model.AdoptionPost, error) {
	var posts []model.AdoptionPost
	db := Db

	for key, value := range filters {
		switch key {
		case "species", "size", "sex", "zone":
			db = db.Where(key+" = ?", value)
		case "neutered", "complete_vaccines":
			boolVal := value == "true"
			db = db.Where(key+" = ?", boolVal)
		case "age":
			switch value {
			case "0-1":
				db = db.Where("age >= ? AND age <= ?", 0, 1)
			case "2-3":
				db = db.Where("age >= ? AND age <= ?", 2, 3)
			case "4-7":
				db = db.Where("age >= ? AND age <= ?", 4, 7)
			case "8plus":
				db = db.Where("age >= ?", 8)
			}
		}
	}

	result := db.Find(&posts)
	if result.Error != nil {
		return nil, result.Error
	}
	return posts, nil
}

func (c *adoptionPostClient) MarkAdoptionPostAsAdopted(id int) error {
	var post model.AdoptionPost
	if err := Db.First(&post, id).Error; err != nil {
		return err
	}
	post.AdoptionStatus = true
	if err := Db.Save(&post).Error; err != nil {
		return err
	}
	return nil
}

func (c *adoptionPostClient) GetAllAdoptionPostsByUserId(userId int) model.AdoptionPosts {
	var posts model.AdoptionPosts
	err := Db.Where("user_id = ?", userId).Find(&posts).Error
	if err != nil {
		log.Error("Error fetching posts by user: ", err)
		return model.AdoptionPosts{}
	}
	return posts
}

func (c *adoptionPostClient) UploadAdoptionImage(image model.AdoptionImage) (model.AdoptionImage, error) {
	result := Db.Create(&image)
	return image, result.Error
}

func (c *adoptionPostClient) GetImagesByAdoptionPostId(postId int) ([]model.AdoptionImage, error) {
	var images []model.AdoptionImage
	result := Db.Where("adoption_post_id = ?", postId).Find(&images)
	return images, result.Error
}

func (c *adoptionPostClient) GetImageById(id int) model.AdoptionImage {
	var image model.AdoptionImage
	Db.First(&image, id)
	return image
}

func (c *adoptionPostClient) DeleteImageById(imageId int) error {
	if err := Db.Delete(&model.AdoptionImage{}, imageId).Error; err != nil {
		return err
	}
	return nil
}

func (c *adoptionPostClient) DeleteAllImagesByAdoptionPostId(postId int) error {
	result := Db.Where("adoption_post_id = ?", postId).Delete(&model.AdoptionImage{})
	return result.Error
}
