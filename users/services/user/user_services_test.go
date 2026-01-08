package services_test

import (
	"errors"
	"testing"
	clients "users/clients/user"
	"users/dto"
	"users/model"
	services "users/services/user"

	"users/utils/queue"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"golang.org/x/crypto/bcrypt"
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

func (m *mockUserClient) GetAllSuspendedUsers() ([]model.User, error) {
	args := m.Called()
	return args.Get(0).([]model.User), args.Error(1)
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

// TESTS ResetPassword
func TestResetPassword_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	user := model.User{
		UserId:   7,
		Name:     "Test",
		Surname:  "User",
		Dni:      123,
		Email:    "test@example.com",
		Password: "$2a$10$abcdefghijklmnopqrstuv", // hashed placeholder, not used for reset validation
		Type:     false,
	}

	mockClient.On("GetUserById", 7).Return(user)
	mockClient.On("ChangePassword", 7, mock.Anything).Return(nil)

	dtoReset := dto.ResetPasswordDto{
		NewPassword1: "NewPass123",
		NewPassword2: "NewPass123",
	}

	err := services.UserService.ResetPassword(7, dtoReset)

	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
}

func TestResetPassword_Error_InvalidPasswordFormat(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	user := model.User{UserId: 5, Email: "a@b.com"}
	mockClient.On("GetUserById", 5).Return(user)

	dtoReset := dto.ResetPasswordDto{
		NewPassword1: "short",
		NewPassword2: "short",
	}

	err := services.UserService.ResetPassword(5, dtoReset)

	assert.EqualError(t, err, "la contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
	mockClient.AssertExpectations(t)
}

func TestUpdateUser_Error_UserNotFound(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	mockClient.On("GetUserById", 123).Return(model.User{})

	_, err := services.UserService.UpdateUser(dto.UpdateUserDto{UserId: 123, Name: "X"})

	assert.EqualError(t, err, "usuario no encontrado")
	mockClient.AssertExpectations(t)
}

func TestGetUserByEmail_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	expected := model.User{UserId: 2, Email: "user@example.com", Name: "U"}
	mockClient.On("GetUserByEmail", "user@example.com").Return(expected)

	res, err := services.UserService.GetUserByEmail("user@example.com")

	assert.Nil(t, err)
	assert.Equal(t, expected.UserId, res.UserId)
	assert.Equal(t, expected.Email, res.Email)
	mockClient.AssertExpectations(t)
}

func TestGetUserByEmail_NotFound(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	mockClient.On("GetUserByEmail", "missing@example.com").Return(model.User{})

	_, err := services.UserService.GetUserByEmail("missing@example.com")

	assert.EqualError(t, err, "user not found")
	mockClient.AssertExpectations(t)
}

// TESTS InsertUser - Casos adicionales
func TestInsertUser_Error_InvalidEmail(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	inputDto := dto.UserDto{
		Name:      "Test",
		Surname:   "User",
		Dni:       12345678,
		Email:     "invalid-email",
		Password:  "ValidPass123",
		Type:      false,
		Suspended: false,
	}

	_, err := services.UserService.InsertUser(inputDto)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "email inválido")
}

func TestInsertUser_Error_InvalidPassword_TooShort(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	inputDto := dto.UserDto{
		Name:      "Test",
		Surname:   "User",
		Dni:       12345678,
		Email:     "test@example.com",
		Password:  "Short1",
		Type:      false,
		Suspended: false,
	}

	_, err := services.UserService.InsertUser(inputDto)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "la contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
}

func TestInsertUser_Error_InvalidPassword_NoUppercase(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	inputDto := dto.UserDto{
		Name:      "Test",
		Surname:   "User",
		Dni:       12345678,
		Email:     "test@example.com",
		Password:  "lowercase123",
		Type:      false,
		Suspended: false,
	}

	_, err := services.UserService.InsertUser(inputDto)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "la contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
}

func TestInsertUser_Error_InvalidPassword_NoLowercase(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	inputDto := dto.UserDto{
		Name:      "Test",
		Surname:   "User",
		Dni:       12345678,
		Email:     "test@example.com",
		Password:  "UPPERCASE123",
		Type:      false,
		Suspended: false,
	}

	_, err := services.UserService.InsertUser(inputDto)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "la contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
}

func TestInsertUser_Error_InvalidPassword_NoNumber(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	inputDto := dto.UserDto{
		Name:      "Test",
		Surname:   "User",
		Dni:       12345678,
		Email:     "test@example.com",
		Password:  "NoNumbers",
		Type:      false,
		Suspended: false,
	}

	_, err := services.UserService.InsertUser(inputDto)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "la contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
}

func TestInsertUser_Error_InvalidDni(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	inputDto := dto.UserDto{
		Name:      "Test",
		Surname:   "User",
		Dni:       0,
		Email:     "test@example.com",
		Password:  "ValidPass123",
		Type:      false,
		Suspended: false,
	}

	_, err := services.UserService.InsertUser(inputDto)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "el DNI es obligatorio y debe ser un número válido")
}

func TestInsertUser_Error_EmailAlreadyExists(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	inputDto := dto.UserDto{
		Name:      "Test",
		Surname:   "User",
		Dni:       12345678,
		Email:     "existing@example.com",
		Password:  "ValidPass123",
		Type:      false,
		Suspended: false,
	}

	existingUser := model.User{UserId: 1, Email: "existing@example.com"}
	mockClient.On("GetUserByEmail", "existing@example.com").Return(existingUser)

	_, err := services.UserService.InsertUser(inputDto)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "ya existe un usuario con ese email")
	mockClient.AssertExpectations(t)
}

// TESTS Login - Casos adicionales
func TestLogin_Error_UserNotFound(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	mockClient.On("GetUserByEmail", "nonexistent@example.com").Return(model.User{})

	input := dto.LoginDto{
		Email:    "nonexistent@example.com",
		Password: "Password123",
	}

	_, err := services.UserService.Login(input)

	assert.EqualError(t, err, "invalid credentials")
	mockClient.AssertExpectations(t)
}

// TESTS UpdateUser - Casos adicionales
func TestUpdateUser_Error_InvalidEmail(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	existingUser := model.User{UserId: 1, Email: "old@example.com"}
	mockClient.On("GetUserById", 1).Return(existingUser)

	input := dto.UpdateUserDto{
		UserId: 1,
		Email:  "invalid-email",
	}

	_, err := services.UserService.UpdateUser(input)

	assert.EqualError(t, err, "email inválido")
	mockClient.AssertExpectations(t)
}

func TestUpdateUser_Error_UpdateFailed(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	existingUser := model.User{UserId: 1, Email: "old@example.com"}
	mockClient.On("GetUserById", 1).Return(existingUser)
	mockClient.On("GetUserByEmail", "new@example.com").Return(model.User{})
	mockClient.On("UpdateUser", mock.Anything).Return(model.User{}, errors.New("database error"))

	input := dto.UpdateUserDto{
		UserId: 1,
		Email:  "new@example.com",
	}

	_, err := services.UserService.UpdateUser(input)

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "error al actualizar el usuario")
	mockClient.AssertExpectations(t)
}

// TESTS ChangePassword - Casos adicionales
func TestChangePassword_Error_UserNotFound(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	mockClient.On("GetUserById", 999).Return(model.User{})

	dto := dto.ChangePasswordDto{
		UserId:       999,
		OldPassword:  "OldPass123",
		NewPassword1: "NewPass123",
		NewPassword2: "NewPass123",
	}

	err := services.UserService.ChangePassword(dto)

	assert.EqualError(t, err, "user not found")
	mockClient.AssertExpectations(t)
}

func TestChangePassword_Error_InvalidNewPassword(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	oldPassword := "OldPass123"
	hashed, _ := bcrypt.GenerateFromPassword([]byte(oldPassword), bcrypt.DefaultCost)

	mockUser := model.User{
		UserId:   1,
		Password: string(hashed),
	}

	mockClient.On("GetUserById", 1).Return(mockUser)

	dto := dto.ChangePasswordDto{
		UserId:       1,
		OldPassword:  oldPassword,
		NewPassword1: "short",
		NewPassword2: "short",
	}

	err := services.UserService.ChangePassword(dto)

	assert.EqualError(t, err, "la contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
	mockClient.AssertExpectations(t)
}

func TestChangePassword_Error_PasswordsDoNotMatch(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	oldPassword := "OldPass123"
	hashed, _ := bcrypt.GenerateFromPassword([]byte(oldPassword), bcrypt.DefaultCost)

	mockUser := model.User{
		UserId:   1,
		Password: string(hashed),
	}

	mockClient.On("GetUserById", 1).Return(mockUser)

	dto := dto.ChangePasswordDto{
		UserId:       1,
		OldPassword:  oldPassword,
		NewPassword1: "NewPass123",
		NewPassword2: "Different123",
	}

	err := services.UserService.ChangePassword(dto)

	assert.EqualError(t, err, "las contraseñas nuevas no coinciden")
	mockClient.AssertExpectations(t)
}

func TestChangePassword_Error_ChangePasswordFailed(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	oldPassword := "OldPass123"
	hashed, _ := bcrypt.GenerateFromPassword([]byte(oldPassword), bcrypt.DefaultCost)

	mockUser := model.User{
		UserId:   1,
		Password: string(hashed),
	}

	mockClient.On("GetUserById", 1).Return(mockUser)
	mockClient.On("ChangePassword", 1, mock.Anything).Return(errors.New("database error"))

	dto := dto.ChangePasswordDto{
		UserId:       1,
		OldPassword:  oldPassword,
		NewPassword1: "NewPass123",
		NewPassword2: "NewPass123",
	}

	err := services.UserService.ChangePassword(dto)

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "error al cambiar la contraseña")
	mockClient.AssertExpectations(t)
}

// TESTS ResetPassword - Casos adicionales
func TestResetPassword_Error_UserNotFound(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	mockClient.On("GetUserById", 999).Return(model.User{})

	dtoReset := dto.ResetPasswordDto{
		NewPassword1: "NewPass123",
		NewPassword2: "NewPass123",
	}

	err := services.UserService.ResetPassword(999, dtoReset)

	assert.EqualError(t, err, "user not found")
	mockClient.AssertExpectations(t)
}

func TestResetPassword_Error_PasswordsDoNotMatch(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	user := model.User{UserId: 5, Email: "test@example.com"}
	mockClient.On("GetUserById", 5).Return(user)

	dtoReset := dto.ResetPasswordDto{
		NewPassword1: "NewPass123",
		NewPassword2: "Different123",
	}

	err := services.UserService.ResetPassword(5, dtoReset)

	assert.EqualError(t, err, "las contraseñas nuevas no coinciden")
	mockClient.AssertExpectations(t)
}

func TestResetPassword_Error_ChangePasswordFailed(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	user := model.User{UserId: 7, Email: "test@example.com"}
	mockClient.On("GetUserById", 7).Return(user)
	mockClient.On("ChangePassword", 7, mock.Anything).Return(errors.New("database error"))

	dtoReset := dto.ResetPasswordDto{
		NewPassword1: "NewPass123",
		NewPassword2: "NewPass123",
	}

	err := services.UserService.ResetPassword(7, dtoReset)

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "error al cambiar la contraseña")
	mockClient.AssertExpectations(t)
}

// TESTS SuspendUser
func TestSuspendUser_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	user := model.User{
		UserId:    1,
		Name:      "Test",
		Surname:   "User",
		Email:     "test@example.com",
		Type:      false,
		Suspended: false,
	}

	suspendedUser := user
	suspendedUser.Suspended = true

	mockClient.On("SuspendUser", 1).Return(suspendedUser, nil)
	// SendSuspensionNotificationEmail llama a GetUserById internamente
	mockClient.On("GetUserById", 1).Return(user)

	result, err := services.UserService.SuspendUser(1)

	assert.Nil(t, err)
	assert.Equal(t, true, result.Suspended)
	assert.NotEmpty(t, result.Token)
	mockClient.AssertExpectations(t)
}

// TESTS ReactivateUser
func TestReactivateUser_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	user := model.User{
		UserId:    1,
		Name:      "Test",
		Surname:   "User",
		Email:     "test@example.com",
		Type:      false,
		Suspended: true,
	}

	reactivatedUser := user
	reactivatedUser.Suspended = false

	mockClient.On("ReactivateUser", 1).Return(reactivatedUser, nil)
	// SendReactivationNotificationEmail llama a GetUserById internamente
	mockClient.On("GetUserById", 1).Return(user)

	result, err := services.UserService.ReactivateUser(1)

	assert.Nil(t, err)
	assert.Equal(t, false, result.Suspended)
	assert.NotEmpty(t, result.Token)
	mockClient.AssertExpectations(t)
}

// TESTS GetAllSuspendedUsers
func TestGetAllSuspendedUsers_Success(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	suspendedUsers := []model.User{
		{UserId: 1, Name: "User1", Email: "user1@example.com", Suspended: true},
		{UserId: 2, Name: "User2", Email: "user2@example.com", Suspended: true},
	}

	mockClient.On("GetAllSuspendedUsers").Return(suspendedUsers, nil)

	result, err := services.UserService.GetAllSuspendedUsers()

	assert.Nil(t, err)
	assert.Equal(t, 2, len(result))
	assert.Equal(t, 1, result[0].UserId)
	assert.Equal(t, 2, result[1].UserId)
	mockClient.AssertExpectations(t)
}

func TestGetAllSuspendedUsers_Error(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	mockClient.On("GetAllSuspendedUsers").Return([]model.User{}, errors.New("database error"))

	_, err := services.UserService.GetAllSuspendedUsers()

	assert.NotNil(t, err)
	assert.EqualError(t, err, "database error")
	mockClient.AssertExpectations(t)
}

// TESTS DeleteUser - Casos adicionales
func TestDeleteUser_Success_WithAdmin(t *testing.T) {
	mockClient := new(mockUserClient)
	mockQueue := new(mockQueueProducer)
	clients.UserClient = mockClient
	queue.QueueProducer = mockQueue

	user := model.User{
		UserId:    1,
		Name:      "User",
		Surname:   "ToDelete",
		Email:     "user@example.com",
		Type:      false,
		Suspended: false,
	}

	admin := model.User{
		UserId: 2,
		Name:   "Admin",
		Email:  "admin@example.com",
		Type:   true,
	}

	mockClient.On("GetUserById", 1).Return(user)
	mockClient.On("GetUserById", 2).Return(admin)
	mockClient.On("DeleteUser", user).Return(nil)
	mockQueue.On("Publish", mock.Anything).Return(nil)

	err := services.UserService.DeleteUser(1, 2, true)

	assert.Nil(t, err)
	mockClient.AssertExpectations(t)
	mockQueue.AssertExpectations(t)
}

func TestDeleteUser_Error_QueuePublishFailed(t *testing.T) {
	mockClient := new(mockUserClient)
	mockQueue := new(mockQueueProducer)
	clients.UserClient = mockClient
	queue.QueueProducer = mockQueue

	user := model.User{
		UserId:    1,
		Name:      "User",
		Surname:   "ToDelete",
		Email:     "user@example.com",
		Type:      false,
		Suspended: false,
	}

	mockClient.On("GetUserById", 1).Return(user)
	mockClient.On("DeleteUser", user).Return(nil)
	mockQueue.On("Publish", mock.Anything).Return(errors.New("queue error"))

	err := services.UserService.DeleteUser(1, 1, false)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "queue error")
	mockClient.AssertExpectations(t)
	mockQueue.AssertExpectations(t)
}

func TestDeleteUser_Error_DeleteFailed(t *testing.T) {
	mockClient := new(mockUserClient)
	clients.UserClient = mockClient

	user := model.User{
		UserId:    1,
		Name:      "User",
		Surname:   "ToDelete",
		Email:     "user@example.com",
		Type:      false,
		Suspended: false,
	}

	mockClient.On("GetUserById", 1).Return(user)
	mockClient.On("DeleteUser", user).Return(errors.New("database error"))

	err := services.UserService.DeleteUser(1, 1, false)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "database error")
	mockClient.AssertExpectations(t)
}
