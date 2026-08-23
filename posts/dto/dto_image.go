package dto

type ImageDto struct {
	ImageId  string `json:"imageId"`
	PostId   string `json:"postId"`
	UserId   int 	`json:"userId"`
	Filepath string `json:"filepath"`
}

type ImagesDto []ImageDto
