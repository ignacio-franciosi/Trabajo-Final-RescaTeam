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
	GetAdoptionPostById(id int) (dto.AdoptionPostDto, e.ApiError)
	DeleteAdoptionPost(id int) error
	GetAllAdoptionPosts() (dto.AdoptionPostsDto, error)
	UpdateAdoptionPost(adoptionPostDto dto.AdoptionPostDto) (dto.AdoptionPostDto, error)
	GetFilteredAdoptionPosts(filters map[string]string) ([]dto.AdoptionPostDto, e.ApiError)
	MarkAdoptionPostAsAdopted(id int, userId int) error
	GetAllAdoptionPostsByUserId(userId int) (dto.AdoptionPostsDto, error)
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
	adoptionPost.Zone = adoptionPostDto.Zone

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
	response.Zone = adoptionPost.Zone

	return response, nil
}

func (s *adoptionService) GetAdoptionPostById(id int) (dto.AdoptionPostDto, e.ApiError) {
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
	adoptionPostDto.Zone = adoptionPost.Zone

	return adoptionPostDto, nil

}

func (s *adoptionService) DeleteAdoptionPost(id int) error {

	adoptionPost := adoptionPostClient.GetAdoptionPostById(id)

	if adoptionPost.AdoptionPostId == 0 {
		return errors.New("adoption Post not found")
	}

	err := adoptionPostClient.DeleteAdoptionPost(adoptionPost)

	return err
}

func (s *adoptionService) GetAllAdoptionPosts() (dto.AdoptionPostsDto, error) {
	var posts model.AdoptionPosts = adoptionPostClient.GetAllAdoptionPosts()
	var postsDto dto.AdoptionPostsDto

	for _, post := range posts {
		postDto := dto.AdoptionPostDto{
			AdoptionPostId:   post.AdoptionPostId,
			UserId:           post.UserId,
			Name:             post.Name,
			Species:          post.Species,
			Age:              post.Age,
			Breed:            post.Breed,
			Color:            post.Color,
			Size:             post.Size,
			Sex:              post.Sex,
			Description:      post.Description,
			Neutered:         post.Neutered,
			CompleteVaccines: post.CompleteVaccines,
			AdoptionStatus:   post.AdoptionStatus,
			Date:             post.Date,
			Zone:             post.Zone,
		}
		postsDto = append(postsDto, postDto)
	}

	return postsDto, nil
}

func (s *adoptionService) UpdateAdoptionPost(postDto dto.AdoptionPostDto) (dto.AdoptionPostDto, error) {
	// Obtener el post actual desde la base de datos
	existingPost := adoptionPostClient.GetAdoptionPostById(postDto.AdoptionPostId)

	if existingPost.AdoptionPostId == 0 {
		return postDto, errors.New("adoption post not found")
	}

	// Actualizar los campos
	existingPost.Name = postDto.Name
	existingPost.Species = postDto.Species
	existingPost.Age = postDto.Age
	existingPost.Breed = postDto.Breed
	existingPost.Color = postDto.Color
	existingPost.Size = postDto.Size
	existingPost.Sex = postDto.Sex
	existingPost.Description = postDto.Description
	existingPost.Neutered = postDto.Neutered
	existingPost.CompleteVaccines = postDto.CompleteVaccines
	existingPost.AdoptionStatus = postDto.AdoptionStatus
	existingPost.Date = postDto.Date
	existingPost.Zone = postDto.Zone

	// Actualizar en la base de datos
	updatedPost, err := adoptionPostClient.UpdateAdoptionPostById(postDto.AdoptionPostId, existingPost)
	if err != nil || updatedPost.AdoptionPostId == 0 {
		return postDto, errors.New("error updating adoption post")
	}

	// Setear el userId en el DTO para la respuesta
	postDto.UserId = existingPost.UserId

	return postDto, nil
}

func (s *adoptionService) GetFilteredAdoptionPosts(filters map[string]string) ([]dto.AdoptionPostDto, e.ApiError) {
	posts, err := adoptionPostClient.GetFilteredAdoptionPosts(filters)

	if err != nil {
		return nil, e.NewNotFoundApiError(err.Error())
	}

	var postDtos []dto.AdoptionPostDto
	for _, p := range posts {
		postDtos = append(postDtos, dto.AdoptionPostDto{
			AdoptionPostId:   p.AdoptionPostId,
			UserId:           p.UserId,
			Name:             p.Name,
			Species:          p.Species,
			Age:              p.Age,
			Breed:            p.Breed,
			Color:            p.Color,
			Size:             p.Size,
			Sex:              p.Sex,
			Description:      p.Description,
			Neutered:         p.Neutered,
			CompleteVaccines: p.CompleteVaccines,
			AdoptionStatus:   p.AdoptionStatus,
			Date:             p.Date,
			Zone:             p.Zone,
		})
	}

	return postDtos, nil
}

func (s *adoptionService) MarkAdoptionPostAsAdopted(id int, userId int) error {
	post := adoptionPostClient.GetAdoptionPostById(id)

	if post.AdoptionPostId == 0 {
		return errors.New("publicación no encontrada")
	}

	if post.UserId != userId {
		return errors.New("no estás autorizado para modificar esta publicación")
	}

	err := adoptionPostClient.MarkAdoptionPostAsAdopted(id)
	if err != nil {
		return errors.New("no se pudo marcar como adoptada")
	}

	return nil
}

func (s *adoptionService) GetAllAdoptionPostsByUserId(userId int) (dto.AdoptionPostsDto, error) {
	posts := adoptionPostClient.GetAllAdoptionPostsByUserId(userId)
	var postsDto dto.AdoptionPostsDto

	for _, post := range posts {
		postDto := dto.AdoptionPostDto{
			AdoptionPostId:   post.AdoptionPostId,
			UserId:           post.UserId,
			Name:             post.Name,
			Species:          post.Species,
			Age:              post.Age,
			Breed:            post.Breed,
			Color:            post.Color,
			Size:             post.Size,
			Sex:              post.Sex,
			Description:      post.Description,
			Neutered:         post.Neutered,
			CompleteVaccines: post.CompleteVaccines,
			AdoptionStatus:   post.AdoptionStatus,
			Date:             post.Date,
			Zone:             post.Zone,
		}
		postsDto = append(postsDto, postDto)
	}

	return postsDto, nil
}
