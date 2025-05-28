package services_test

import (
	"testing"
	"users/clients"
	"users/dto"
	"users/model"
	"users/services"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// --- Mock que implementa la interfaz del client ---

type mockUserClient struct {
	mock.Mock
}

func (m *mockUserClient) GetUserById(id int) model.User {
	args := m.Called(id)
	return args.Get(0).(model.User)
}

func (m *mockUserClient) GetUserByEmail(email string) model.User {
	args := m.Called(email)
	return args.Get(0).(model.User)
}

func (m *mockUserClient) InsertUser(user model.User) model.User {
	args := m.Called(user)
	return args.Get(0).(model.User)
}

// --------------------------------
func (m *mockUserClient) UpdateUser(user model.User) (model.User, error) {
	args := m.Called(user)
	return args.Get(0).(model.User), args.Error(1)
}

func (m *mockUserClient) ChangePassword(userId int, hashedPassword string) error {
	args := m.Called(userId, hashedPassword)
	return args.Error(0)
}

func (m *mockUserClient) DeleteUser(user model.User) error {
	args := m.Called(user)
	return args.Error(0)
}

func TestInsertUser_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	inputDto := dto.UserDto{
		Name:      "Jack",
		Surname:   "Johnson",
		Dni:       17628787,
		Email:     "bananapancakes@gmail.com",
		Phone:     "351678936",
		Password:  "Sunsets4somebodyelse",
		Type:      false,
		Suspended: false,
	}

	mockClient.On("GetUserByEmail", inputDto.Email).Return(model.User{})

	mockClient.On("InsertUser", mock.AnythingOfType("model.User")).Return(model.User{
		UserId:    1,
		Name:      "Jack",
		Surname:   "Johnson",
		Dni:       17628787,
		Email:     "bananapancakes@gmail.com",
		Phone:     "351678936",
		Type:      false,
		Suspended: false,
	})

	result, err := services.UserService.InsertUser(inputDto)

	assert.Nil(t, err)
	assert.Equal(t, 1, result.UserId)
	assert.Equal(t, false, result.Type)
	assert.Equal(t, false, result.Suspended)
	assert.NotEmpty(t, result.Token)

	mockClient.AssertExpectations(t)
}

func TestInsertUser_Error_MissingFields(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	inputDto := dto.UserDto{
		Name:     "",
		Surname:  "Johnson",
		Email:    "test@example.com",
		Password: "Valid123",
		Dni:      12345678,
	}

	_, err := services.UserService.InsertUser(inputDto)

	assert.NotNil(t, err)
	assert.Equal(t, "todos los campos son obligatorios", err.Error())
}

func TestGetUserById_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	expectedUser := model.User{
		UserId:    42,
		Name:      "Ada",
		Surname:   "Lovelace",
		Dni:       12345678,
		Email:     "ada@gmail.com",
		Phone:     "1234567890",
		Password:  "Securepass6",
		Type:      false,
		Suspended: false,
	}

	mockClient.On("GetUserById", 42).Return(expectedUser)

	result, err := services.UserService.GetUserById(42)

	assert.Nil(t, err)
	assert.Equal(t, expectedUser.UserId, result.UserId)
	assert.Equal(t, expectedUser.Email, result.Email)
	assert.Equal(t, expectedUser.Name, result.Name)
	assert.Equal(t, expectedUser.Suspended, result.Suspended)

	mockClient.AssertExpectations(t)
}

func TestGetUserById_Error_NotFound(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	mockClient.On("GetUserById", 999).Return(model.User{})

	result, err := services.UserService.GetUserById(999)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "user not found")
	assert.Equal(t, 0, result.UserId)

	mockClient.AssertExpectations(t)
}

func TestDeleteUser_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	user := model.User{
		UserId:    1,
		Name:      "Lord",
		Surname:   "Byron",
		Dni:       17628787,
		Email:     "lordbyron@gmail.com",
		Phone:     "351678936",
		Type:      false,
		Suspended: false,
	}

	mockClient.On("GetUserById", 1).Return(user)
	mockClient.On("DeleteUser", user).Return(nil)

	err := services.UserService.DeleteUser(1)

	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
}

func TestDeleteUser_Error_UserNotFound(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	mockClient.On("GetUserById", 99).Return(model.User{})

	err := services.UserService.DeleteUser(99)

	assert.EqualError(t, err, "user not found")
	mockClient.AssertExpectations(t)
}
