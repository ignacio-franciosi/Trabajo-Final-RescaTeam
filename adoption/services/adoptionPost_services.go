package services

import (
	adoptionPostClient "adoption/clients"
	"adoption/dto"
	"adoption/model"
	e "adoption/utils/errors"
)

type adoptionService struct{}

type adoptionServiceInterface interface {
	InsertAdoptionPost(adoptionPostDto dto.AdoptionPostDto) (dto.AdoptionPostDto, e.ApiError)
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
