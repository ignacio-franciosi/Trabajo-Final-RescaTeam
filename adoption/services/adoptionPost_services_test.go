package services_test

import (
	"net/http"
	"testing"

	"adoption/clients"
	"adoption/dto"
	"adoption/model"
	"adoption/services"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// --- Mock que implementa la interfaz del client ---

type mockAdoptionPostClient struct {
	mock.Mock
}

func (m *mockAdoptionPostClient) InsertAdoptionPost(post model.AdoptionPost) model.AdoptionPost {
	args := m.Called(post)                  //Registra que se llamó a esta función y devuelve lo que se configuró con .On().Return()
	return args.Get(0).(model.AdoptionPost) //Devuelve el valor que se configuró como "retorno" del mock
}

func (m *mockAdoptionPostClient) GetAdoptionPostById(id int) model.AdoptionPost {
	args := m.Called(id)
	return args.Get(0).(model.AdoptionPost)
}

func (m *mockAdoptionPostClient) DeleteAdoptionPost(post model.AdoptionPost) error {
	args := m.Called(post)
	return args.Error(0)
}
func (m *mockAdoptionPostClient) GetAllAdoptionPosts() model.AdoptionPosts {
	args := m.Called()
	return args.Get(0).(model.AdoptionPosts)
}

func (m *mockAdoptionPostClient) UpdateAdoptionPostById(id int, post model.AdoptionPost) (model.AdoptionPost, error) {
	return model.AdoptionPost{}, nil
}
func (m *mockAdoptionPostClient) GetFilteredAdoptionPosts(filters map[string]string) ([]model.AdoptionPost, error) {
	args := m.Called(filters)
	return args.Get(0).([]model.AdoptionPost), args.Error(1)
}

func (m *mockAdoptionPostClient) MarkAdoptionPostAsAdopted(id int) error {
	args := m.Called(id)
	return args.Error(0)
}
func (m *mockAdoptionPostClient) GetAllAdoptionPostsByUserId(userId int) model.AdoptionPosts {
	args := m.Called()
	return args.Get(0).(model.AdoptionPosts)
}
func (m *mockAdoptionPostClient) UploadAdoptionImage(image model.AdoptionImage) (model.AdoptionImage, error) {
	return model.AdoptionImage{}, nil
}
func (m *mockAdoptionPostClient) GetImagesByAdoptionPostId(postId int) ([]model.AdoptionImage, error) {
	return nil, nil
}
func (m *mockAdoptionPostClient) GetImageById(id int) model.AdoptionImage {
	return model.AdoptionImage{}
}
func (m *mockAdoptionPostClient) DeleteImageById(imageId int) error {
	return nil
}
func (m *mockAdoptionPostClient) DeleteAllImagesByAdoptionPostId(postId int) error {
	return nil
}

// --- TEST SUCCESS ---
func TestInsertAdoptionPost_Success(t *testing.T) {
	mockClient := new(mockAdoptionPostClient)
	clients.AdoptionPostClient = mockClient // sustituimos el client real por el mock

	inputDto := dto.AdoptionPostDto{
		UserId:           1,
		Name:             "Max",
		Species:          "Perro",
		Age:              2,
		Breed:            "Labrador",
		Color:            "Negro",
		Size:             "Grande",
		Sex:              "Macho",
		Description:      "Amigable",
		Neutered:         true,
		CompleteVaccines: true,
		AdoptionStatus:   false,
		Date:             "2025-05-27",
		Zone:             "Centro",
	}

	expectedModel := model.AdoptionPost{
		AdoptionPostId:   100,
		UserId:           inputDto.UserId,
		Name:             inputDto.Name,
		Species:          inputDto.Species,
		Age:              inputDto.Age,
		Breed:            inputDto.Breed,
		Color:            inputDto.Color,
		Size:             inputDto.Size,
		Sex:              inputDto.Sex,
		Description:      inputDto.Description,
		Neutered:         inputDto.Neutered,
		CompleteVaccines: inputDto.CompleteVaccines,
		AdoptionStatus:   inputDto.AdoptionStatus,
		Date:             inputDto.Date,
		Zone:             inputDto.Zone,
	}

	mockClient.On("InsertAdoptionPost", mock.AnythingOfType("model.AdoptionPost")).Return(expectedModel) //Cuando se llame a InsertAdPost(), devolvé expectedModel.

	result, err := services.AdoptionService.InsertAdoptionPost(inputDto)

	assert.Nil(t, err)
	assert.Equal(t, 100, result.AdoptionPostId)
	assert.Equal(t, "Max", result.Name)
	mockClient.AssertExpectations(t)
}

func TestGetAdoptionPostById_Success(t *testing.T) {
	mockClient := new(mockAdoptionPostClient)
	clients.AdoptionPostClient = mockClient

	mockResponse := model.AdoptionPost{
		AdoptionPostId: 1,
		UserId:         5,
		Name:           "Firulais",
	}

	mockClient.On("GetAdoptionPostById", 1).Return(mockResponse)

	expected := dto.AdoptionPostDto{
		AdoptionPostId: 1,
		UserId:         5,
		Name:           "Firulais",
	}

	response, err := services.AdoptionService.GetAdoptionPostById(1)

	assert.Nil(t, err)
	assert.Equal(t, expected, response)

	mockClient.AssertExpectations(t)
}

func TestDeleteAdoptionPost_Success(t *testing.T) {
	mockClient := new(mockAdoptionPostClient)
	clients.AdoptionPostClient = mockClient

	id := 1
	post := model.AdoptionPost{
		AdoptionPostId: id, //simula que el AdoptionPost existe
		Name:           "Firulais",
	}

	mockClient.On("GetAdoptionPostById", id).Return(post)
	mockClient.On("DeleteAdoptionPost", post).Return(nil)

	err := services.AdoptionService.DeleteAdoptionPost(id)

	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
}

func TestGetAllAdoptionPosts_Success(t *testing.T) {
	mockClient := new(mockAdoptionPostClient)
	clients.AdoptionPostClient = mockClient

	mockPosts := model.AdoptionPosts{
		{
			AdoptionPostId:   1,
			UserId:           100,
			Name:             "Luna",
			Species:          "Perro",
			Age:              3,
			Breed:            "Labrador",
			Color:            "Negro",
			Size:             "Grande",
			Sex:              "Hembra",
			Description:      "Muy juguetona",
			Neutered:         true,
			CompleteVaccines: true,
			AdoptionStatus:   true,
			Date:             "2024-01-01",
			Zone:             "Centro",
		},
	}

	mockClient.On("GetAllAdoptionPosts").Return(mockPosts)

	result, err := services.AdoptionService.GetAllAdoptionPosts()

	assert.Nil(t, err)
	assert.Len(t, result, 1)

	expected := dto.AdoptionPostDto{
		AdoptionPostId:   1,
		UserId:           100,
		Name:             "Luna",
		Species:          "Perro",
		Age:              3,
		Breed:            "Labrador",
		Color:            "Negro",
		Size:             "Grande",
		Sex:              "Hembra",
		Description:      "Muy juguetona",
		Neutered:         true,
		CompleteVaccines: true,
		AdoptionStatus:   true,
		Date:             "2024-01-01",
		Zone:             "Centro",
	}

	assert.Equal(t, expected, result[0])
	mockClient.AssertExpectations(t)
}

// --- TEST ERROR ---

func TestInsertAdoptionPost_UserNotFound_Error(t *testing.T) {
	// No necesitamos mock en este caso porque no se llama al client si UserId es 0
	inputDto := dto.AdoptionPostDto{
		UserId: 0,
		Name:   "Firulais",
	}

	result, err := services.AdoptionService.InsertAdoptionPost(inputDto)

	assert.NotNil(t, err)
	assert.Equal(t, "user not found", err.Message())
	assert.Equal(t, http.StatusBadRequest, err.Status())
	assert.Equal(t, 0, result.AdoptionPostId) // el resultado debe estar vacío
}

func TestGetAdoptionPostById_NotFound(t *testing.T) {
	mockClient := new(mockAdoptionPostClient)
	clients.AdoptionPostClient = mockClient

	mockClient.On("GetAdoptionPostById", 0).Return(model.AdoptionPost{})

	response, err := services.AdoptionService.GetAdoptionPostById(0)

	assert.NotNil(t, err)
	assert.Equal(t, "Adoption post not found", err.Message())
	assert.Equal(t, 0, response.AdoptionPostId)

	mockClient.AssertExpectations(t)
}

func TestDeleteAdoptionPost_NotFound(t *testing.T) {
	mockClient := new(mockAdoptionPostClient)
	clients.AdoptionPostClient = mockClient

	id := 999
	//simula que el adoptionPost no existe
	mockClient.On("GetAdoptionPostById", id).Return(model.AdoptionPost{})

	err := services.AdoptionService.DeleteAdoptionPost(id)

	assert.NotNil(t, err)
	assert.Equal(t, "adoption Post not found", err.Error())

	mockClient.AssertExpectations(t)
}
