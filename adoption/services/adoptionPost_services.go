package services

import (
	adoptionPostClient "adoption/clients"
	"adoption/dto"
	"adoption/model"
	e "adoption/utils/errors"
	"errors"
)

type adoptionService struct{}

type adoptionServiceInterface interface {
	InsertAdoptionPost(adoptionPostDto dto.AdoptionPostDto) (dto.AdoptionPostDto, e.ApiError)
	GetAdoptionPostById(id string) (dto.AdoptionPostDto, e.ApiError)
	DeleteAdoptionPost(id string) error
}

var (
	AdoptionService adoptionServiceInterface
)

func init() {
	AdoptionService = &adoptionService{}
}

func (s *adoptionService) InsertAdoptionPost(adoptionPostDto dto.AdoptionPostDto) (dto.AdoptionPostDto, e.ApiError) {
	var adoptionPost model.AdoptionPost

	adoptionPost.UserId = adoptionPostDto.UserId
	adoptionPost.Name = adoptionPostDto.Name
	adoptionPost.Species = adoptionPostDto.Species
	adoptionPost.Age = adoptionPostDto.Age
	adoptionPost.Breed = adoptionPostDto.Breed
	adoptionPost.Color = adoptionPostDto.Color
	adoptionPost.Size = adoptionPostDto.Size
	adoptionPost.Sex = adoptionPostDto.Sex
	adoptionPost.Description = adoptionPostDto.Description
	adoptionPost.Neutered = adoptionPostDto.Neutered
	adoptionPost.CompleteVaccines = adoptionPostDto.CompleteVaccines
	adoptionPost.AdoptionStatus = adoptionPostDto.AdoptionStatus
	adoptionPost.Date = adoptionPostDto.Date

	adoptionPost = adoptionPostClient.InsertAdoptionPost(adoptionPost)

	var response dto.AdoptionPostDto

	response.AdoptionPostId = adoptionPost.AdoptionPostId
	response.UserId = adoptionPost.UserId
	response.Name = adoptionPost.Name
	response.Species = adoptionPost.Species
	response.Age = adoptionPost.Age
	response.Breed = adoptionPost.Breed
	response.Color = adoptionPost.Color
	response.Size = adoptionPost.Size
	response.Sex = adoptionPost.Sex
	response.Description = adoptionPost.Description
	response.Neutered = adoptionPost.Neutered
	response.CompleteVaccines = adoptionPost.CompleteVaccines
	response.AdoptionStatus = adoptionPost.AdoptionStatus
	response.Date = adoptionPost.Date

	return response, nil
}

func (s *adoptionService) GetAdoptionPostById(id string) (dto.AdoptionPostDto, e.ApiError) {
	var adoptionPost model.AdoptionPost = adoptionPostClient.GetAdoptionPostById(id)
	var adoptionPostDto dto.AdoptionPostDto

	if adoptionPost.AdoptionPostId == 0 {
		return adoptionPostDto, e.NewBadRequestApiError("Adoption post not found")
	}

	adoptionPostDto.AdoptionPostId = adoptionPost.AdoptionPostId
	adoptionPostDto.UserId = adoptionPost.UserId
	adoptionPostDto.Name = adoptionPost.Name
	adoptionPostDto.Species = adoptionPost.Species
	adoptionPostDto.Age = adoptionPost.Age
	adoptionPostDto.Breed = adoptionPost.Breed
	adoptionPostDto.Color = adoptionPost.Color
	adoptionPostDto.Size = adoptionPost.Size
	adoptionPostDto.Sex = adoptionPost.Sex
	adoptionPostDto.Description = adoptionPost.Description
	adoptionPostDto.Neutered = adoptionPost.Neutered
	adoptionPostDto.CompleteVaccines = adoptionPost.CompleteVaccines
	adoptionPostDto.AdoptionStatus = adoptionPost.AdoptionStatus
	adoptionPostDto.Date = adoptionPost.Date

	return adoptionPostDto, nil

}

func (s *adoptionService) DeleteAdoptionPost(id string) error {

	adoptionPost := adoptionPostClient.GetAdoptionPostById(id)

	if adoptionPost.AdoptionPostId == 0 {
		return errors.New("adoption Post not found")
	}

	err := adoptionPostClient.DeleteAdoptionPost(adoptionPost)

	return err
}
