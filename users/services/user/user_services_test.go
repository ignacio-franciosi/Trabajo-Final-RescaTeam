package services_test

import (
	"testing"
	clients "users/clients/user"
	"users/dto"
	"users/model"
	services "users/services/user"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang.org/x/crypto/bcrypt"
	"users/utils/queue"
)

// --- Mock que implementa la interfaz del client ---

type mockUserClient struct {
	mock.Mock
}

type mockQueueProducer struct {
	mock.Mock
}

func (m *mockQueueProducer) Publish(body []byte) error {
	args := m.Called(body)
	return args.Error(0)
}

func (m *mockQueueProducer) InitQueue() {
	m.Called()
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

func (m *mockUserClient) UpdateUser(user model.User) (model.User, error) {
	args := m.Called(user)
	return args.Get(0).(model.User), args.Error(1)
}
func (m *mockUserClient) SuspendUser(user int) (model.User, error) {
	args := m.Called(user)
	return args.Get(0).(model.User), args.Error(1)
}
func (m *mockUserClient) ReactivateUser(user int) (model.User, error) {
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



// --- TESTS ---

// TESTS GetUserById
func TestGetUserById_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	expectedUser := model.User{
		UserId:    42,
		Name:      "Ada",
		Surname:   "Lovelace",
		Dni:       12345678,
		Email:     "ada@gmail.com",
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

// TESTS Login
func TestLogin_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("Password123"), bcrypt.DefaultCost)

	user := model.User{
		UserId:    1,
		Email:     "user@example.com",
		Password:  string(hashedPassword),
		Type:      true,
		Suspended: false,
	}

	mockClient.On("GetUserByEmail", "user@example.com").Return(user)

	input := dto.LoginDto{
		Email:    "user@example.com",
		Password: "Password123",
	}

	result, err := services.UserService.Login(input)

	assert.Nil(t, err)
	assert.Equal(t, user.UserId, result.UserId)
	assert.Equal(t, user.Type, result.Type)
	assert.Equal(t, user.Suspended, result.Suspended)
	assert.NotEmpty(t, result.Token)
	mockClient.AssertExpectations(t)
}

func TestLogin_WrongPassword(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("correctPassword123"), bcrypt.DefaultCost)

	user := model.User{
		UserId:   1,
		Email:    "user@example.com",
		Password: string(hashedPassword),
	}

	mockClient.On("GetUserByEmail", "user@example.com").Return(user)

	input := dto.LoginDto{
		Email:    "user@example.com",
		Password: "wrongPassword1",
	}

	_, err := services.UserService.Login(input)

	assert.EqualError(t, err, "invalid credentials")
	mockClient.AssertExpectations(t)
}

// TESTS InsertUser
func TestInsertUser_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	inputDto := dto.UserDto{
		Name:      "Jack",
		Surname:   "Johnson",
		Dni:       17628787,
		Email:     "bananapancakes@gmail.com",
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

// TESTS UpdateUser
func TestUpdateUser_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	existingUser := model.User{
		UserId:    1,
		Name:      "Old",
		Surname:   "User",
		Dni:       12345678,
		Email:     "old@example.com",
		Type:      false,
		Suspended: false,
	}

	updatedUser := existingUser
	updatedUser.Name = "New"
	updatedUser.Email = "new@example.com"

	input := dto.UpdateUserDto{
		UserId: 1,
		Name:   "New",
		Email:  "new@example.com",
	}

	mockClient.On("GetUserById", 1).Return(existingUser)
	mockClient.On("GetUserByEmail", "new@example.com").Return(model.User{})
	mockClient.On("UpdateUser", mock.MatchedBy(func(u model.User) bool {
		return u.Name == "New" && u.Email == "new@example.com"
	})).Return(updatedUser, nil)

	result, err := services.UserService.UpdateUser(input)

	assert.Nil(t, err)
	assert.Equal(t, "New", result.Name)
	assert.Equal(t, "new@example.com", result.Email)
	mockClient.AssertExpectations(t)
}

func TestUpdateUser_Error_EmailAlreadyExists(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	existingUser := model.User{UserId: 1, Email: "old@example.com"}

	mockClient.On("GetUserById", 1).Return(existingUser)
	mockClient.On("GetUserByEmail", "new@example.com").Return(model.User{UserId: 2})

	input := dto.UpdateUserDto{
		UserId: 1,
		Email:  "new@example.com",
	}

	_, err := services.UserService.UpdateUser(input)

	assert.EqualError(t, err, "ya existe otro usuario con ese email")
	mockClient.AssertExpectations(t)
}

// TESTS ChangePassword
func TestChangePassword_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	oldPassword := "OldPass123"
	hashed, _ := bcrypt.GenerateFromPassword([]byte(oldPassword), bcrypt.DefaultCost)

	mockUser := model.User{
		UserId:    1,
		Name:      "Lord",
		Surname:   "Byron",
		Dni:       17628787,
		Email:     "lordbyron@gmail.com",
		Password:  string(hashed),
		Type:      false,
		Suspended: false,
	}

	dto := dto.ChangePasswordDto{
		UserId:       1,
		OldPassword:  oldPassword,
		NewPassword1: "NewPass123",
		NewPassword2: "NewPass123",
	}

	mockClient.On("GetUserById", dto.UserId).Return(mockUser)
	mockClient.On("ChangePassword", dto.UserId, mock.Anything).Return(nil)

	err := services.UserService.ChangePassword(dto)

	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
}

func TestChangePassword_Error_InvalidOldPassword(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	correctPassword := "CorrectPassword1"
	hashed, _ := bcrypt.GenerateFromPassword([]byte(correctPassword), bcrypt.DefaultCost)

	mockUser := model.User{
		UserId:    1,
		Name:      "Lord",
		Surname:   "Byron",
		Dni:       17628787,
		Email:     "lordbyron@gmail.com",
		Password:  string(hashed),
		Type:      false,
		Suspended: false,
	}

	dto := dto.ChangePasswordDto{
		UserId:       1,
		OldPassword:  "WrongPassword1",
		NewPassword1: "NewPass123",
		NewPassword2: "NewPass123",
	}

	mockClient.On("GetUserById", dto.UserId).Return(mockUser)

	err := services.UserService.ChangePassword(dto)

	assert.EqualError(t, err, "invalid credentials")
}

// TESTS DeleteUser

func TestDeleteUser_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	mockQueue := new(mockQueueProducer)
	clients.UserClient = mockClient
	queue.QueueProducer = mockQueue

	user := model.User{
		UserId:    1,
		Name:      "Lord",
		Surname:   "Byron",
		Dni:       17628787,
		Email:     "lordbyron@gmail.com",
		Password:  "Securepass6",
		Type:      false,
		Suspended: false,
	}

	mockClient.On("GetUserById", 1).Return(user)
	mockClient.On("DeleteUser", user).Return(nil)
	mockQueue.On("Publish", mock.Anything).Return(nil)

	err := services.UserService.DeleteUser(1, 1, false)

	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
	mockQueue.AssertExpectations(t)
}

func TestDeleteUser_Error_UserNotFound(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	mockClient.On("GetUserById", 99).Return(model.User{})

	err := services.UserService.DeleteUser(99, 1, false)

	assert.EqualError(t, err, "user not found")
	mockClient.AssertExpectations(t)
}