package services_test

import (
	"adoption/clients"
	"adoption/dto"
	"adoption/model"
	"adoption/services"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// --- Mock que implementa la interfaz del client ---

type mockAdoptionPostClient struct {
	mock.Mock
}

func (m *mockAdoptionPostClient) InsertAdoptionPost(post model.AdoptionPost) model.AdoptionPost {
	args := m.Called(post)
	return args.Get(0).(model.AdoptionPost)
}

// Métodos no utilizados en este test:
func (m *mockAdoptionPostClient) GetAdoptionPostById(id int) model.AdoptionPost {
	return model.AdoptionPost{}
}
func (m *mockAdoptionPostClient) DeleteAdoptionPost(adoptionPost model.AdoptionPost) error {
	return nil
}
func (m *mockAdoptionPostClient) GetAllAdoptionPosts() model.AdoptionPosts { return nil }
func (m *mockAdoptionPostClient) UpdateAdoptionPostById(id int, post model.AdoptionPost) (model.AdoptionPost, error) {
	return model.AdoptionPost{}, nil
}
func (m *mockAdoptionPostClient) GetFilteredAdoptionPosts(filters map[string]string) ([]model.AdoptionPost, error) {
	return nil, nil
}
func (m *mockAdoptionPostClient) MarkAdoptionPostAsAdopted(id int) error { return nil }
func (m *mockAdoptionPostClient) GetAllAdoptionPostsByUserId(userId int) model.AdoptionPosts {
	return nil
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
func (m *mockAdoptionPostClient) DeleteImageById(imageId int) error                { return nil }
func (m *mockAdoptionPostClient) DeleteAllImagesByAdoptionPostId(postId int) error { return nil }

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

	mockClient.On("InsertAdoptionPost", mock.AnythingOfType("model.AdoptionPost")).Return(expectedModel)

	result, err := services.AdoptionService.InsertAdoptionPost(inputDto)

	assert.Nil(t, err)
	assert.Equal(t, 100, result.AdoptionPostId)
	assert.Equal(t, "Max", result.Name)
	mockClient.AssertExpectations(t)
}

// --- TEST ERROR (simula error devolviendo modelo vacío) ---
func TestInsertAdoptionPost_Error(t *testing.T) {
	mockClient := new(mockAdoptionPostClient)
	clients.AdoptionPostClient = mockClient // sustituimos el client real por el mock

	inputDto := dto.AdoptionPostDto{
		Name: "Sin ID",
	}

	emptyModel := model.AdoptionPost{} // simulamos fallo: no se asigna ID ni datos

	mockClient.On("InsertAdoptionPost", mock.AnythingOfType("model.AdoptionPost")).Return(emptyModel)

	result, err := services.AdoptionService.InsertAdoptionPost(inputDto)

	assert.Nil(t, err) // el servicio actual no devuelve errores, así que err debe ser nil
	assert.Equal(t, 0, result.AdoptionPostId)
	assert.Empty(t, result.Name)
	mockClient.AssertExpectations(t)
}

func TestInsertAdoptionPost_UserIdZero_Error(t *testing.T) {
	// No necesitamos mock en este caso porque no se llama al client si UserId es 0
	inputDto := dto.AdoptionPostDto{
		UserId: 0,
		Name:   "Firulais",
	}

	result, err := services.AdoptionService.InsertAdoptionPost(inputDto)

	assert.NotNil(t, err)
	assert.Equal(t, "UserId cannot be 0", err.Message())
	assert.Equal(t, http.StatusBadRequest, err.Status())
	assert.Equal(t, 0, result.AdoptionPostId) // el resultado debe estar vacío
}
