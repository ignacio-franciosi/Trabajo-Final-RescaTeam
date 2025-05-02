package dto

type AdoptionPostDto struct {
	AdoptionPostId   int    `json:"adoptionPostId"`
	UserId           int    `json:"userId"`
	Name             string `json:"name"`
	Species          string `json:"species"`
	Age              int    `json:"age"`
	Breed            string `json:"breed"`
	Color            string `json:"color"`
	Size             string `json:"size"`
	Sex              string `json:"sex"`
	Description      string `json:"description"`
	Neutered         bool   `json:"neutered"`
	CompleteVaccines bool   `json:"completeVaccines"`
	AdoptionStatus   bool   `json:"adoptionStatus"`
	Date             string `json:"date"`
}

type AdoptionPostsDto []AdoptionPostDto
