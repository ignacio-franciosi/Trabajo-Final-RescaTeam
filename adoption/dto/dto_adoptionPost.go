package dto

type AdoptionPostDto struct {
	AdoptionPostId   int    `json:"id_adoption_post"`
	UserId           int    `json:"id_user"`
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
	Zone             string `json:"zone"`
}

type AdoptionPostsDto []AdoptionPostDto
