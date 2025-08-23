package dto

type ImageDto struct {
	ImageId  string `json:"imageId"`
	PostId   string `json:"postId"`
	Filepath string `json:"filepath"`
}

type ImagesDto []ImageDto
