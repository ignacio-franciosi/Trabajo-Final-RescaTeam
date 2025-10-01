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
