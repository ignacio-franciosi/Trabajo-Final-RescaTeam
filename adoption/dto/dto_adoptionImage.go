package dto

type AdoptionImageDto struct {
	ImageId        int    `json:"image_id"`
	AdoptionPostId int    `json:"adoption_post_id"`
	FilePath       string `json:"file_path"`
}

type AdoptionImagesDto []AdoptionImageDto
