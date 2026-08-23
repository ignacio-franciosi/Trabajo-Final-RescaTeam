package services_test

import (
	"errors"
	"net/http"
	"testing"

	"posts/clients"
	"posts/dto"
	"posts/model"
	"posts/services"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// --- Helper functions ---
func stringPtr(s string) *string {
	return &s
}

// --- Mock que implementa la interfaz del PostClient ---
type mockPostClient struct {
	mock.Mock
}

func (m *mockPostClient) InsertPost(post model.Post) model.Post {
	args := m.Called(post)
	return args.Get(0).(model.Post)
}

func (m *mockPostClient) GetPostById(id string) (model.Post, error) {
	args := m.Called(id)
	return args.Get(0).(model.Post), args.Error(1)
}

func (m *mockPostClient) DeletePost(post model.Post) error {
	args := m.Called(post)
	return args.Error(0)
}

func (m *mockPostClient) GetAllPosts(postType string) model.Posts {
	args := m.Called(postType)
	return args.Get(0).(model.Posts)
}

func (m *mockPostClient) UpdatePostById(id string, post model.Post) (model.Post, error) {
	args := m.Called(id, post)
	return args.Get(0).(model.Post), args.Error(1)
}

func (m *mockPostClient) GetFilteredPosts(filters map[string]string) ([]model.Post, error) {
	args := m.Called(filters)
	return args.Get(0).([]model.Post), args.Error(1)
}

func (m *mockPostClient) MarkPostAsResolved(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *mockPostClient) GetAllPostsByUserId(userId int) (model.Posts, error) {
	args := m.Called(userId)
	return args.Get(0).(model.Posts), args.Error(1)
}

func (m *mockPostClient) DeleteAllImagesByPostId(postId string) error {
	args := m.Called(postId)
	return args.Error(0)
}

func (m *mockPostClient) DeleteImageById(imageId string) error {
	args := m.Called(imageId)
	return args.Error(0)
}

func (m *mockPostClient) DeleteAllPostsByUserId(userId int) error {
	args := m.Called(userId)
	return args.Error(0)
}

func (m *mockPostClient) DeleteAllImagesByUserId(userId int) error {
	args := m.Called(userId)
	return args.Error(0)
}

func (m *mockPostClient) GetImageById(id string) (model.Image, error) {
	args := m.Called(id)
	return args.Get(0).(model.Image), args.Error(1)
}

func (m *mockPostClient) GetImagesByPostId(postId string) ([]model.Image, error) {
	args := m.Called(postId)
	return args.Get(0).([]model.Image), args.Error(1)
}

func (m *mockPostClient) GetAllImagesByUserId(userId int) ([]model.Image, error) {
	args := m.Called(userId)
	return args.Get(0).([]model.Image), args.Error(1)
}

func (m *mockPostClient) UploadImage(image model.Image) (model.Image, error) {
	args := m.Called(image)
	return args.Get(0).(model.Image), args.Error(1)
}

// --- TEST SUCCESS ---

func TestInsertPost_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	inputDto := dto.PostDto{
		UserId:   1,
		PostType: "adoption",
		Name:     stringPtr("Max"),
		Species:  stringPtr("Perro"),
		Sex:      stringPtr("Macho"),
	}

	expectedModel := model.Post{
		PostId:   primitive.NewObjectID(),
		UserId:   inputDto.UserId,
		PostType: inputDto.PostType,
		Name:     stringPtr("Max"),
		Species:  stringPtr("Perro"),
		Sex:      stringPtr("Macho"),
	}

	mockClient.On("InsertPost", mock.AnythingOfType("model.Post")).Return(expectedModel)

	result, err := services.PostsService.InsertPost(inputDto)

	assert.Nil(t, err)
	assert.Equal(t, expectedModel.PostId.Hex(), result.PostId)
	assert.Equal(t, stringPtr("Max"), result.Name)
	mockClient.AssertExpectations(t)
}

func TestGetPostById_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockResponse := model.Post{
		PostId:   primitive.NewObjectID(),
		UserId:   5,
		PostType: "adoption",
		Name:     stringPtr("Firulais"),
	}

	mockClient.On("GetPostById", "123").Return(mockResponse, nil)

	response, err := services.PostsService.GetPostById("123")

	assert.Nil(t, err)
	assert.Equal(t, mockResponse.Name, response.Name)
	assert.Equal(t, mockResponse.UserId, response.UserId)

	mockClient.AssertExpectations(t)
}

func TestDeletePost_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	id := "123"
	post := model.Post{PostId: primitive.NewObjectID(), Name: stringPtr("Firulais")}

	mockClient.On("GetPostById", id).Return(post, nil)
	mockClient.On("DeletePost", post).Return(nil)

	err := services.PostsService.DeletePost(id)

	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
}

func TestGetAllPosts_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockPosts := model.Posts{
		{
			PostId:   primitive.NewObjectID(),
			UserId:   100,
			PostType: "adoption",
			Name:     stringPtr("Luna"),
			Species:  stringPtr("Perro"),
			Sex:      stringPtr("Hembra"),
		},
	}

	mockClient.On("GetAllPosts", "adoption").Return(mockPosts)

	result, err := services.PostsService.GetAllPosts("adoption")

	assert.Nil(t, err)
	assert.Len(t, result, 1)
	assert.Equal(t, stringPtr("Luna"), result[0].Name)
	mockClient.AssertExpectations(t)
}

func TestUpdatePost_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	id := primitive.NewObjectID()
	existing := model.Post{
		PostId:   id,
		UserId:   10,
		PostType: "adoption",
		Name:     stringPtr("Old"),
	}

	updated := existing
	updated.Name = stringPtr("New")

	inputDto := dto.PostDto{
		PostId:   id.Hex(),
		Name:     stringPtr("New"),
		Species:  stringPtr("Perro"),
		PostType: "adoption",
	}

	mockClient.On("GetPostById", id.Hex()).Return(existing, nil)
	mockClient.On("UpdatePostById", id.Hex(), mock.MatchedBy(func(p model.Post) bool {
		return p.Name != nil && *p.Name == "New"
	})).Return(updated, nil)

	res, err := services.PostsService.UpdatePost(inputDto)

	assert.Nil(t, err)
	assert.Equal(t, id.Hex(), res.PostId)
	assert.Equal(t, stringPtr("New"), res.Name)
	assert.Equal(t, 10, res.UserId)
	mockClient.AssertExpectations(t)
}

func TestUpdatePost_NotFound(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	id := primitive.NewObjectID().Hex()
	mockClient.On("GetPostById", id).Return(model.Post{}, errors.New("not found"))

	_, err := services.PostsService.UpdatePost(dto.PostDto{PostId: id, Name: stringPtr("X")})

	assert.EqualError(t, err, "post not found")
	mockClient.AssertExpectations(t)
}

func TestGetFilteredPosts_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	post := model.Post{PostId: primitive.NewObjectID(), UserId: 1, PostType: "adoption", Name: stringPtr("Luna")}
	filters := map[string]string{"species": "perro"}
	mockClient.On("GetFilteredPosts", filters).Return([]model.Post{post}, nil)

	res, err := services.PostsService.GetFilteredPosts(filters)

	assert.Nil(t, err)
	assert.Len(t, res, 1)
	assert.Equal(t, stringPtr("Luna"), res[0].Name)
	mockClient.AssertExpectations(t)
}

func TestGetFilteredPosts_Error(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	filters := map[string]string{"species": "gato"}
	mockClient.On("GetFilteredPosts", filters).Return([]model.Post{}, errors.New("no results"))

	_, err := services.PostsService.GetFilteredPosts(filters)

	assert.NotNil(t, err)
	assert.Equal(t, "no results", err.Message())
	assert.Equal(t, http.StatusNotFound, err.Status())
	mockClient.AssertExpectations(t)
}

func TestMarkPostAsResolved_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	id := primitive.NewObjectID().Hex()
	mockClient.On("GetPostById", id).Return(model.Post{PostId: primitive.NewObjectID()}, nil)
	mockClient.On("MarkPostAsResolved", id).Return(nil)

	err := services.PostsService.MarkPostAsResolved(id)
	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
}

func TestMarkPostAsResolved_NotFound(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	id := primitive.NewObjectID().Hex()
	mockClient.On("GetPostById", id).Return(model.Post{}, errors.New("not found"))

	err := services.PostsService.MarkPostAsResolved(id)
	assert.EqualError(t, err, "publicación no encontrada")
	mockClient.AssertExpectations(t)
}

func TestMarkPostAsResolved_UpdateFails(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	id := primitive.NewObjectID().Hex()
	mockClient.On("GetPostById", id).Return(model.Post{PostId: primitive.NewObjectID()}, nil)
	mockClient.On("MarkPostAsResolved", id).Return(errors.New("db error"))

	err := services.PostsService.MarkPostAsResolved(id)
	assert.EqualError(t, err, "no se pudo marcar como resuelta")
	mockClient.AssertExpectations(t)
}

func TestGetAllPostsByUserId_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	p := model.Post{PostId: primitive.NewObjectID(), UserId: 99, Name: stringPtr("A")}
	mockClient.On("GetAllPostsByUserId", 99).Return(model.Posts{p}, nil)

	res, err := services.PostsService.GetAllPostsByUserId(99)
	assert.Nil(t, err)
	assert.Len(t, res, 1)
	assert.Equal(t, 99, res[0].UserId)
	mockClient.AssertExpectations(t)
}

func TestGetAllPostsByUserId_Error(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetAllPostsByUserId", 100).Return(model.Posts{}, errors.New("db error"))

	_, err := services.PostsService.GetAllPostsByUserId(100)
	assert.EqualError(t, err, "db error")
	mockClient.AssertExpectations(t)
}

func TestGetImageById_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	img := model.Image{ImageId: primitive.NewObjectID(), PostId: "p1", UserId: 1, Filepath: "https://s3/test.jpg"}
	mockClient.On("GetImageById", img.ImageId.Hex()).Return(img, nil)

	dtoImg, err := services.PostsService.GetImageById(img.ImageId.Hex())
	assert.Nil(t, err)
	assert.Equal(t, img.ImageId.Hex(), dtoImg.ImageId)
	assert.Equal(t, "p1", dtoImg.PostId)
	assert.Equal(t, 1, dtoImg.UserId)
	assert.Equal(t, "https://s3/test.jpg", dtoImg.Filepath)
	mockClient.AssertExpectations(t)
}

func TestGetImageById_NotFound(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetImageById", "bad").Return(model.Image{}, errors.New("not found"))

	_, err := services.PostsService.GetImageById("bad")
	assert.NotNil(t, err)
	assert.Equal(t, http.StatusBadRequest, err.Status())
	assert.Equal(t, "Image not found", err.Message())
	mockClient.AssertExpectations(t)
}

func TestGetImagesByPostId_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	imgs := []model.Image{{ImageId: primitive.NewObjectID(), PostId: "p1", UserId: 1, Filepath: "url1"}}
	mockClient.On("GetImagesByPostId", "p1").Return(imgs, nil)

	res, err := services.PostsService.GetImagesByPostId("p1")
	assert.Nil(t, err)
	assert.Len(t, res, 1)
	assert.Equal(t, "p1", res[0].PostId)
	mockClient.AssertExpectations(t)
}

func TestGetImagesByPostId_Error(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetImagesByPostId", "p2").Return([]model.Image{}, errors.New("db down"))

	_, err := services.PostsService.GetImagesByPostId("p2")
	assert.NotNil(t, err)
	assert.Equal(t, http.StatusInternalServerError, err.Status())
	mockClient.AssertExpectations(t)
}

func TestGetAllImagesByUserId_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	imgs := []model.Image{{ImageId: primitive.NewObjectID(), PostId: "p1", UserId: 7, Filepath: "u"}}
	mockClient.On("GetAllImagesByUserId", 7).Return(imgs, nil)

	res, err := services.PostsService.GetAllImagesByUserId(7)
	assert.Nil(t, err)
	assert.Len(t, res, 1)
	assert.Equal(t, 7, res[0].UserId)
	mockClient.AssertExpectations(t)
}

func TestGetAllImagesByUserId_Error(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetAllImagesByUserId", 8).Return([]model.Image{}, errors.New("db err"))

	_, err := services.PostsService.GetAllImagesByUserId(8)
	assert.NotNil(t, err)
	assert.Equal(t, http.StatusInternalServerError, err.Status())
	mockClient.AssertExpectations(t)
}

func TestDeleteAllPostsByUserId_Success(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("DeleteAllPostsByUserId", 22).Return(nil)
	err := services.PostsService.DeleteAllPostsByUserId(22)
	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
}

func TestDeleteAllPostsByUserId_Error(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("DeleteAllPostsByUserId", 23).Return(errors.New("db err"))
	err := services.PostsService.DeleteAllPostsByUserId(23)
	assert.EqualError(t, err, "error al eliminar posts del usuario 23: db err")
	mockClient.AssertExpectations(t)
}

// --- TEST ERROR ---

func TestInsertPost_UserNotFound_Error(t *testing.T) {
	inputDto := dto.PostDto{
		UserId:   0,
		PostType: "adoption",
		Name:     stringPtr("Firulais"),
		Species:  stringPtr("Perro"),
		Sex:      stringPtr("Macho"),
	}

	result, err := services.PostsService.InsertPost(inputDto)

	assert.NotNil(t, err)
	assert.Equal(t, "user not found", err.Message())
	assert.Equal(t, http.StatusBadRequest, err.Status())
	assert.Equal(t, "", result.PostId)
}

func TestGetPostById_NotFound(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetPostById", "0").Return(model.Post{}, errors.New("not found"))

	response, err := services.PostsService.GetPostById("0")

	assert.NotNil(t, err)
	assert.Equal(t, "Post not found", err.Message())
	assert.Equal(t, "", response.PostId)

	mockClient.AssertExpectations(t)
}

func TestDeletePost_NotFound(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	id := "999"
	mockClient.On("GetPostById", id).Return(model.Post{}, errors.New("not found"))

	err := services.PostsService.DeletePost(id)

	assert.NotNil(t, err)
	assert.Equal(t, "post not found", err.Error())

	mockClient.AssertExpectations(t)
}

// TESTS GetAllPosts - Casos adicionales
func TestGetAllPosts_EmptyResult(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetAllPosts", "lost").Return(model.Posts{})

	result, err := services.PostsService.GetAllPosts("lost")

	assert.Nil(t, err)
	assert.Len(t, result, 0)
	mockClient.AssertExpectations(t)
}

func TestGetAllPosts_MultipleTypes(t *testing.T) {
	tests := []struct {
		name     string
		postType string
	}{
		{"adoption", "adoption"},
		{"lost", "lost"},
		{"found", "found"},
		{"empty_type", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := new(mockPostClient)
			clients.PostClient = mockClient

			posts := model.Posts{
				{PostId: primitive.NewObjectID(), PostType: tt.postType, UserId: 1},
			}
			mockClient.On("GetAllPosts", tt.postType).Return(posts)

			result, err := services.PostsService.GetAllPosts(tt.postType)

			assert.Nil(t, err)
			assert.Len(t, result, 1)
			assert.Equal(t, tt.postType, result[0].PostType)
			mockClient.AssertExpectations(t)
		})
	}
}

// TESTS UpdatePost - Casos adicionales
func TestUpdatePost_Error_UpdateFailed(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	id := primitive.NewObjectID()
	existing := model.Post{PostId: id, UserId: 10, PostType: "adoption"}

	mockClient.On("GetPostById", id.Hex()).Return(existing, nil)
	mockClient.On("UpdatePostById", id.Hex(), mock.Anything).Return(model.Post{}, errors.New("db error"))

	inputDto := dto.PostDto{PostId: id.Hex(), Name: stringPtr("New")}
	_, err := services.PostsService.UpdatePost(inputDto)

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "error updating")
	mockClient.AssertExpectations(t)
}

func TestUpdatePost_PartialUpdate(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	id := primitive.NewObjectID()
	existing := model.Post{
		PostId:   id,
		UserId:   10,
		PostType: "adoption",
		Name:     stringPtr("Old Name"),
		Species:  stringPtr("Perro"),
	}

	updated := existing
	updated.Name = stringPtr("New Name")

	inputDto := dto.PostDto{
		PostId:  id.Hex(),
		Name:    stringPtr("New Name"),
		Species: existing.Species, // Mantener especie original
	}

	mockClient.On("GetPostById", id.Hex()).Return(existing, nil)
	mockClient.On("UpdatePostById", id.Hex(), mock.Anything).Return(updated, nil)

	result, err := services.PostsService.UpdatePost(inputDto)

	assert.Nil(t, err)
	assert.Equal(t, "New Name", *result.Name)
	assert.Equal(t, existing.UserId, result.UserId)
	mockClient.AssertExpectations(t)
}

// TESTS GetFilteredPosts - Casos adicionales con table-driven tests
func TestGetFilteredPosts_TableDriven(t *testing.T) {
	tests := []struct {
		name          string
		filters       map[string]string
		mockPosts     []model.Post
		mockError     error
		expectedError bool
		expectedCount int
	}{
		{
			name:          "filter_by_species",
			filters:       map[string]string{"species": "perro"},
			mockPosts:     []model.Post{{PostId: primitive.NewObjectID(), Species: stringPtr("perro")}},
			expectedCount: 1,
		},
		{
			name:          "filter_by_zone",
			filters:       map[string]string{"zone": "Córdoba"},
			mockPosts:     []model.Post{{PostId: primitive.NewObjectID(), Zone: stringPtr("Córdoba")}},
			expectedCount: 1,
		},
		{
			name:          "multiple_filters",
			filters:       map[string]string{"species": "gato", "zone": "Buenos Aires"},
			mockPosts:     []model.Post{{PostId: primitive.NewObjectID(), Species: stringPtr("gato"), Zone: stringPtr("Buenos Aires")}},
			expectedCount: 1,
		},
		{
			name:          "empty_filters",
			filters:       map[string]string{},
			mockPosts:     []model.Post{},
			expectedCount: 0,
		},
		{
			name:          "no_results",
			filters:       map[string]string{"species": "ave"},
			mockError:     errors.New("no results"),
			expectedError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := new(mockPostClient)
			clients.PostClient = mockClient

			mockClient.On("GetFilteredPosts", tt.filters).Return(tt.mockPosts, tt.mockError)

			result, err := services.PostsService.GetFilteredPosts(tt.filters)

			if tt.expectedError {
				assert.NotNil(t, err)
				assert.Nil(t, result)
			} else {
				assert.Nil(t, err)
				assert.Len(t, result, tt.expectedCount)
			}
			mockClient.AssertExpectations(t)
		})
	}
}

// TESTS DeletePost - Casos adicionales
func TestDeletePost_Error_DeleteFailed(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	id := "123"
	post := model.Post{PostId: primitive.NewObjectID(), Name: stringPtr("Firulais")}

	mockClient.On("GetPostById", id).Return(post, nil)
	mockClient.On("DeletePost", post).Return(errors.New("database error"))

	err := services.PostsService.DeletePost(id)

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "database error")
	mockClient.AssertExpectations(t)
}

func TestDeleteImageById_ImageNotFound(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetImageById", "bad-id").Return(model.Image{}, errors.New("not found"))

	err := services.PostsService.DeleteImageById("bad-id")

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "imagen no encontrada")
	mockClient.AssertExpectations(t)
}

// TESTS DeleteAllImagesByPostId
func TestDeleteAllImagesByPostId_Success_NoImages(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetImagesByPostId", "post123").Return([]model.Image{}, nil)

	err := services.PostsService.DeleteAllImagesByPostId("post123")

	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
}

func TestDeleteAllImagesByPostId_Error_GetImagesFailed(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetImagesByPostId", "post123").Return([]model.Image{}, errors.New("db error"))

	err := services.PostsService.DeleteAllImagesByPostId("post123")

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "error al obtener imágenes")
	mockClient.AssertExpectations(t)
}

// TESTS DeleteAllImagesByUserId
func TestDeleteAllImagesByUserId_Success_NoImages(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetAllImagesByUserId", 5).Return([]model.Image{}, nil)
	mockClient.On("DeleteAllImagesByUserId", 5).Return(nil)

	err := services.PostsService.DeleteAllImagesByUserId(5)

	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
}

func TestDeleteAllImagesByUserId_Error_GetImagesFailed(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetAllImagesByUserId", 5).Return([]model.Image{}, errors.New("db error"))

	err := services.PostsService.DeleteAllImagesByUserId(5)

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "error al obtener imagenes")
	mockClient.AssertExpectations(t)
}

func TestDeleteAllImagesByUserId_Error_DeleteFailed(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	images := []model.Image{
		{ImageId: primitive.NewObjectID(), Filepath: "https://s3/test.jpg"},
	}

	mockClient.On("GetAllImagesByUserId", 5).Return(images, nil)
	mockClient.On("DeleteAllImagesByUserId", 5).Return(errors.New("db error"))

	err := services.PostsService.DeleteAllImagesByUserId(5)

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "error al eliminar imagenes")
	mockClient.AssertExpectations(t)
}

// TESTS InsertPost - Casos adicionales con diferentes tipos de posts
func TestInsertPost_DifferentPostTypes(t *testing.T) {
	tests := []struct {
		name     string
		postType string
		userId   int
	}{
		{"adoption_post", "adoption", 1},
		{"lost_post", "lost", 2},
		{"found_post", "found", 3},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockClient := new(mockPostClient)
			clients.PostClient = mockClient

			inputDto := dto.PostDto{
				UserId:   tt.userId,
				PostType: tt.postType,
				Name:     stringPtr("Test"),
			}

			expectedModel := model.Post{
				PostId:   primitive.NewObjectID(),
				UserId:   tt.userId,
				PostType: tt.postType,
				Name:     stringPtr("Test"),
			}

			mockClient.On("InsertPost", mock.AnythingOfType("model.Post")).Return(expectedModel)

			result, err := services.PostsService.InsertPost(inputDto)

			assert.Nil(t, err)
			assert.Equal(t, tt.postType, result.PostType)
			assert.Equal(t, tt.userId, result.UserId)
			mockClient.AssertExpectations(t)
		})
	}
}

// TESTS GetAllPostsByUserId - Casos adicionales
func TestGetAllPostsByUserId_EmptyResult(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	mockClient.On("GetAllPostsByUserId", 99).Return(model.Posts{}, nil)

	result, err := services.PostsService.GetAllPostsByUserId(99)

	assert.Nil(t, err)
	assert.Len(t, result, 0)
	mockClient.AssertExpectations(t)
}

func TestGetAllPostsByUserId_MultiplePosts(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	posts := model.Posts{
		{PostId: primitive.NewObjectID(), UserId: 10, Name: stringPtr("Post 1")},
		{PostId: primitive.NewObjectID(), UserId: 10, Name: stringPtr("Post 2")},
		{PostId: primitive.NewObjectID(), UserId: 10, Name: stringPtr("Post 3")},
	}

	mockClient.On("GetAllPostsByUserId", 10).Return(posts, nil)

	result, err := services.PostsService.GetAllPostsByUserId(10)

	assert.Nil(t, err)
	assert.Len(t, result, 3)
	for i, post := range result {
		assert.Equal(t, 10, post.UserId)
		assert.Equal(t, posts[i].PostId.Hex(), post.PostId)
	}
	mockClient.AssertExpectations(t)
}

// TESTS HandleQueueMessage
func TestHandleQueueMessage_DeleteMessage(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	messageDto := dto.QueueMessageDto{
		Id:      42,
		Message: "delete",
	}

	mockClient.On("DeleteAllPostsByUserId", 42).Return(nil)

	err := services.HandleQueueMessage(messageDto)

	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
}

func TestHandleQueueMessage_DeleteMessage_Error(t *testing.T) {
	mockClient := new(mockPostClient)
	clients.PostClient = mockClient

	messageDto := dto.QueueMessageDto{
		Id:      42,
		Message: "delete",
	}

	mockClient.On("DeleteAllPostsByUserId", 42).Return(errors.New("db error"))

	err := services.HandleQueueMessage(messageDto)

	assert.NotNil(t, err)
	mockClient.AssertExpectations(t)
}

func TestHandleQueueMessage_UnknownMessage(t *testing.T) {
	messageDto := dto.QueueMessageDto{
		Id:      42,
		Message: "unknown",
	}

	err := services.HandleQueueMessage(messageDto)

	assert.Nil(t, err) // Debería retornar nil para mensajes desconocidos
}
