package dto

type PostDto struct {
	PostId           string  `json:"postId"`
	UserId           int     `json:"userId"`
	PostType         string  `json:"postType"`
	PostStatus       bool    `json:"postStatus"`
	Name             *string `json:"name,omitempty"`
	Species          *string `json:"species,omitempty"`
	Age              *int    `json:"age,omitempty"`
	Breed            *string `json:"breed,omitempty"`
	Color            *string `json:"color,omitempty"`
	Size             *string `json:"size,omitempty"`
	Sex              *string `json:"sex,omitempty"`
	Description      *string `json:"description,omitempty"`
	Neutered         *bool   `json:"neutered,omitempty"`
	CompleteVaccines *bool   `json:"completeVaccines,omitempty"`
	Date             *string `json:"date,omitempty"`
	Zone             *string `json:"zone,omitempty"`
	HealthStatus     *string `json:"healthStatus,omitempty"`
	Collar           *bool   `json:"collar,omitempty"`
	CollarColor      *string `json:"collarColor,omitempty"`
}

type PostsDto []PostDto
