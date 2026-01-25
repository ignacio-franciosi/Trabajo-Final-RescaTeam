package services_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"chat/clients/push"
	"chat/dto"
	"chat/model"
	"chat/services"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// --- Mocks ---

type mockRepository struct {
	mock.Mock
}

func (m *mockRepository) FindOrCreateChat(ctx context.Context, me, other, postID string) (model.Chat, error) {
	args := m.Called(ctx, me, other, postID)
	return args.Get(0).(model.Chat), args.Error(1)
}

func (m *mockRepository) GetChat(ctx context.Context, chatID string) (model.Chat, error) {
	args := m.Called(ctx, chatID)
	return args.Get(0).(model.Chat), args.Error(1)
}

func (m *mockRepository) ListChats(ctx context.Context, me string, limit int64) ([]model.Chat, error) {
	args := m.Called(ctx, me, limit)
	return args.Get(0).([]model.Chat), args.Error(1)
}

func (m *mockRepository) SaveMessage(ctx context.Context, msg model.Message) (model.Message, error) {
	args := m.Called(ctx, msg)
	return args.Get(0).(model.Message), args.Error(1)
}

func (m *mockRepository) ListMessages(ctx context.Context, chatID string, limit int64) ([]model.Message, error) {
	args := m.Called(ctx, chatID, limit)
	return args.Get(0).([]model.Message), args.Error(1)
}

func (m *mockRepository) MarkRead(ctx context.Context, chatID, userID string) error {
	args := m.Called(ctx, chatID, userID)
	return args.Error(0)
}

func (m *mockRepository) SaveSubscription(ctx context.Context, sub model.PushSubscription) error {
	args := m.Called(ctx, sub)
	return args.Error(0)
}

func (m *mockRepository) ListSubscriptions(ctx context.Context, userID string) ([]model.PushSubscription, error) {
	args := m.Called(ctx, userID)
	return args.Get(0).([]model.PushSubscription), args.Error(1)
}

func (m *mockRepository) DeleteSubscription(ctx context.Context, endpoint string) error {
	args := m.Called(ctx, endpoint)
	return args.Error(0)
}

// mockHubWrapper implementa HubInterface para poder mockear sus métodos
type mockHubWrapper struct {
	*services.Hub
	mock.Mock
}

func newMockHub() *mockHubWrapper {
	return &mockHubWrapper{
		Hub: services.NewHub(),
	}
}

func (m *mockHubWrapper) SendToUser(userID string, v interface{}) {
	m.Called(userID, v)
	// También llamar al método real si es necesario para comportamiento real
	// m.Hub.SendToUser(userID, v)
}

func (m *mockHubWrapper) HasConnections(userID string) bool {
	args := m.Called(userID)
	if args.Get(0) != nil {
		return args.Bool(0)
	}
	return m.Hub.HasConnections(userID)
}

func (m *mockHubWrapper) AddConnection(userID string, c services.Conn) {
	m.Called(userID, c)
	m.Hub.AddConnection(userID, c)
}

func (m *mockHubWrapper) RemoveConnection(userID string, c services.Conn) {
	m.Called(userID, c)
	m.Hub.RemoveConnection(userID, c)
}

func (m *mockHubWrapper) IsUserInChat(userID string, chat model.Chat) bool {
	args := m.Called(userID, chat)
	if args.Get(0) != nil {
		return args.Bool(0)
	}
	return m.Hub.IsUserInChat(userID, chat)
}

// mockPushClientWrapper envuelve un PushClient real para poder mockear sus métodos
type mockPushClientWrapper struct {
	*push.PushClient
	mock.Mock
}

func newMockPushClient() *mockPushClientWrapper {
	// Crear un PushClient real con claves dummy para testing
	return &mockPushClientWrapper{
		PushClient: push.NewPushClient("test-public-key", "test-private-key"),
	}
}

func (m *mockPushClientWrapper) SendNotifications(ctx context.Context, subs []model.PushSubscription, data []byte) []string {
	args := m.Called(ctx, subs, data)
	if args.Get(0) != nil {
		return args.Get(0).([]string)
	}
	return []string{}
}

func (m *mockPushClientWrapper) PublicKey() string {
	args := m.Called()
	if args.Get(0) != nil {
		return args.String(0)
	}
	return m.PushClient.PublicKey()
}

// Helper functions
func createTestChat(id primitive.ObjectID, user1, user2, postID string) model.Chat {
	return model.Chat{
		ID:           id,
		Participants: [2]string{user1, user2},
		PostID:       postID,
		LastUpdate:   time.Now(),
	}
}

func createTestMessage(id, chatID primitive.ObjectID, senderID, content string) model.Message {
	return model.Message{
		ID:        id,
		ChatID:    chatID,
		SenderID:  senderID,
		Content:   content,
		Timestamp: time.Now(),
		Viewed:    false,
	}
}

// --- TESTS StartChat ---

func TestStartChat_Success(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	me := "user1"
	other := "user2"
	postID := "post123"

	expectedChat := createTestChat(primitive.NewObjectID(), me, other, postID)

	mockRepo.On("FindOrCreateChat", ctx, me, other, postID).Return(expectedChat, nil)

	result, err := service.StartChat(ctx, me, other, postID)

	assert.Nil(t, err)
	assert.Equal(t, expectedChat.ID, result.ID)
	assert.Equal(t, expectedChat.PostID, result.PostID)
	mockRepo.AssertExpectations(t)
}

func TestStartChat_Error_SameUser(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	user := "user1"

	result, err := service.StartChat(ctx, user, user, "post123")

	assert.NotNil(t, err)
	assert.EqualError(t, err, "no puedes iniciar chat contigo mismo")
	assert.Equal(t, primitive.NilObjectID, result.ID)
}

func TestStartChat_Error_RepositoryError(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	me := "user1"
	other := "user2"
	postID := "post123"

	mockRepo.On("FindOrCreateChat", ctx, me, other, postID).Return(model.Chat{}, errors.New("database error"))

	result, err := service.StartChat(ctx, me, other, postID)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "database error")
	assert.Equal(t, primitive.NilObjectID, result.ID)
	mockRepo.AssertExpectations(t)
}

// --- TESTS SendMessage ---

func TestSendMessage_Success_WithChatID(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	receiverID := "user2"
	chatID := primitive.NewObjectID()
	postID := "post123"

	chat := createTestChat(chatID, senderID, receiverID, postID)
	expectedMessage := createTestMessage(primitive.NewObjectID(), chatID, senderID, "Hello")

	mockRepo.On("GetChat", ctx, chatID.Hex()).Return(chat, nil)
	mockRepo.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(expectedMessage, nil)
	mockHub.On("HasConnections", receiverID).Return(false)
	mockHub.On("SendToUser", receiverID, mock.Anything).Return()
	mockRepo.On("ListSubscriptions", ctx, receiverID).Return([]model.PushSubscription{}, nil)

	input := dto.WSMessage{
		ChatID:  chatID.Hex(),
		Content: "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.Nil(t, err)
	assert.Equal(t, expectedMessage.ID, result.ID)
	assert.Equal(t, "Hello", result.Content)
	mockRepo.AssertExpectations(t)
	mockHub.AssertExpectations(t)
}

func TestSendMessage_Success_WithReceiverIDAndPostID(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	receiverID := "user2"
	postID := "post123"
	chatID := primitive.NewObjectID()

	chat := createTestChat(chatID, senderID, receiverID, postID)
	expectedMessage := createTestMessage(primitive.NewObjectID(), chatID, senderID, "Hello")

	mockRepo.On("FindOrCreateChat", ctx, senderID, receiverID, postID).Return(chat, nil)
	mockRepo.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(expectedMessage, nil)
	mockHub.On("HasConnections", receiverID).Return(false)
	mockHub.On("SendToUser", receiverID, mock.Anything).Return()
	mockRepo.On("ListSubscriptions", ctx, receiverID).Return([]model.PushSubscription{}, nil)

	input := dto.WSMessage{
		ReceiverID: receiverID,
		PostID:     postID,
		Content:    "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.Nil(t, err)
	assert.Equal(t, expectedMessage.ID, result.ID)
	mockRepo.AssertExpectations(t)
	mockHub.AssertExpectations(t)
}

func TestSendMessage_Success_FallbackFromChatID(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	receiverID := "user2"
	postID := "post123"
	chatID := primitive.NewObjectID()

	chat := createTestChat(chatID, senderID, receiverID, postID)
	expectedMessage := createTestMessage(primitive.NewObjectID(), chatID, senderID, "Hello")

	mockRepo.On("GetChat", ctx, chatID.Hex()).Return(model.Chat{}, errors.New("not found"))
	mockRepo.On("FindOrCreateChat", ctx, senderID, receiverID, postID).Return(chat, nil)
	mockRepo.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(expectedMessage, nil)
	mockHub.On("HasConnections", receiverID).Return(false)
	mockHub.On("SendToUser", receiverID, mock.Anything).Return()
	mockRepo.On("ListSubscriptions", ctx, receiverID).Return([]model.PushSubscription{}, nil)

	input := dto.WSMessage{
		ChatID:     chatID.Hex(),
		ReceiverID: receiverID,
		PostID:     postID,
		Content:    "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.Nil(t, err)
	assert.Equal(t, expectedMessage.ID, result.ID)
	mockRepo.AssertExpectations(t)
}

func TestSendMessage_Error_MissingData(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"

	tests := []struct {
		name  string
		input dto.WSMessage
	}{
		{"empty", dto.WSMessage{}},
		{"only_chatid_empty", dto.WSMessage{ChatID: ""}},
		{"only_receiverid", dto.WSMessage{ReceiverID: "user2"}},
		{"only_postid", dto.WSMessage{PostID: "post123"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.SendMessage(ctx, senderID, tt.input)

			assert.NotNil(t, err)
			assert.Contains(t, err.Error(), "faltan datos")
			assert.Equal(t, primitive.NilObjectID, result.ID)
		})
	}
}

func TestSendMessage_Error_InvalidChatID(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"

	mockRepo.On("GetChat", ctx, "invalid-id").Return(model.Chat{}, errors.New("invalid"))

	input := dto.WSMessage{
		ChatID:  "invalid-id",
		Content: "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "chatId inválido")
	assert.Equal(t, primitive.NilObjectID, result.ID)
	mockRepo.AssertExpectations(t)
}

func TestSendMessage_Error_NoPermission(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	chatID := primitive.NewObjectID()

	// Chat con participantes diferentes al sender
	chat := createTestChat(chatID, "user2", "user3", "post123")

	mockRepo.On("GetChat", ctx, chatID.Hex()).Return(chat, nil)

	input := dto.WSMessage{
		ChatID:  chatID.Hex(),
		Content: "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "no tienes permiso en este chat")
	assert.Equal(t, primitive.NilObjectID, result.ID)
	mockRepo.AssertExpectations(t)
}

func TestSendMessage_Error_EmptyContent(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	receiverID := "user2"
	postID := "post123"
	chatID := primitive.NewObjectID()

	chat := createTestChat(chatID, senderID, receiverID, postID)

	mockRepo.On("FindOrCreateChat", ctx, senderID, receiverID, postID).Return(chat, nil)

	tests := []struct {
		name    string
		content string
	}{
		{"empty", ""},
		{"whitespace", "   "},
		{"tabs", "\t\t"},
		{"newlines", "\n\n"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			input := dto.WSMessage{
				ReceiverID: receiverID,
				PostID:     postID,
				Content:    tt.content,
			}

			result, err := service.SendMessage(ctx, senderID, input)

			assert.NotNil(t, err)
			assert.EqualError(t, err, "contenido vacío")
			assert.Equal(t, primitive.NilObjectID, result.ID)
		})
	}
}

func TestSendMessage_Error_SaveMessageFailed(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	receiverID := "user2"
	postID := "post123"
	chatID := primitive.NewObjectID()

	chat := createTestChat(chatID, senderID, receiverID, postID)

	mockRepo.On("FindOrCreateChat", ctx, senderID, receiverID, postID).Return(chat, nil)
	mockRepo.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(model.Message{}, errors.New("database error"))

	input := dto.WSMessage{
		ReceiverID: receiverID,
		PostID:     postID,
		Content:    "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "database error")
	assert.Equal(t, primitive.NilObjectID, result.ID)
	mockRepo.AssertExpectations(t)
}

// --- TESTS ListChats ---

func TestListChats_Success(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	userID := "user1"
	limit := int64(10)

	expectedChats := []model.Chat{
		createTestChat(primitive.NewObjectID(), userID, "user2", "post1"),
		createTestChat(primitive.NewObjectID(), userID, "user3", "post2"),
	}

	mockRepo.On("ListChats", ctx, userID, limit).Return(expectedChats, nil)

	result, err := service.ListChats(ctx, userID, limit)

	assert.Nil(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, expectedChats[0].ID, result[0].ID)
	mockRepo.AssertExpectations(t)
}

func TestListChats_EmptyResult(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	userID := "user1"
	limit := int64(10)

	mockRepo.On("ListChats", ctx, userID, limit).Return([]model.Chat{}, nil)

	result, err := service.ListChats(ctx, userID, limit)

	assert.Nil(t, err)
	assert.Len(t, result, 0)
	mockRepo.AssertExpectations(t)
}

func TestListChats_Error(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	userID := "user1"
	limit := int64(10)

	mockRepo.On("ListChats", ctx, userID, limit).Return(([]model.Chat)(nil), errors.New("database error"))

	result, err := service.ListChats(ctx, userID, limit)

	assert.NotNil(t, err)
	assert.Nil(t, result)
	mockRepo.AssertExpectations(t)
}

// --- TESTS ListMessages ---

func TestListMessages_Success(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	chatID := primitive.NewObjectID().Hex()
	limit := int64(20)

	expectedMessages := []model.Message{
		createTestMessage(primitive.NewObjectID(), primitive.NewObjectID(), "user1", "Message 1"),
		createTestMessage(primitive.NewObjectID(), primitive.NewObjectID(), "user2", "Message 2"),
	}

	mockRepo.On("ListMessages", ctx, chatID, limit).Return(expectedMessages, nil)

	result, err := service.ListMessages(ctx, chatID, limit)

	assert.Nil(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, expectedMessages[0].ID, result[0].ID)
	mockRepo.AssertExpectations(t)
}

func TestListMessages_Error(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	chatID := primitive.NewObjectID().Hex()
	limit := int64(20)

	mockRepo.On("ListMessages", ctx, chatID, limit).Return(([]model.Message)(nil), errors.New("database error"))

	result, err := service.ListMessages(ctx, chatID, limit)

	assert.NotNil(t, err)
	assert.Nil(t, result)
	mockRepo.AssertExpectations(t)
}

// --- TESTS MarkRead ---

func TestMarkRead_Success(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	chatObjID := primitive.NewObjectID()
	chatID := chatObjID.Hex()
	userID := "user1"
	otherUser := "user2"

	// Preparar chat y expectativas: GetChat, MarkRead y que el hub reciba el evento
	chat := createTestChat(chatObjID, userID, otherUser, "post123")
	mockRepo.On("GetChat", ctx, chatID).Return(chat, nil)
	mockRepo.On("MarkRead", ctx, chatID, userID).Return(nil)
	mockHub.On("SendToUser", otherUser, mock.Anything).Return()

	err := service.MarkRead(ctx, chatID, userID)

	assert.Nil(t, err)
	mockRepo.AssertExpectations(t)
	mockHub.AssertExpectations(t)
}

func TestMarkRead_Error(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	chatObjID := primitive.NewObjectID()
	chatID := chatObjID.Hex()
	userID := "user1"
	otherUser := "user2"

	chat := createTestChat(chatObjID, userID, otherUser, "post123")
	mockRepo.On("GetChat", ctx, chatID).Return(chat, nil)
	mockRepo.On("MarkRead", ctx, chatID, userID).Return(errors.New("database error"))

	err := service.MarkRead(ctx, chatID, userID)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "database error")
	mockRepo.AssertExpectations(t)
}

// --- TESTS SavePushSubscription ---

func TestSavePushSubscription_Success(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	userID := "user1"

	input := dto.PushSubscription{
		Endpoint: "https://fcm.googleapis.com/endpoint",
		Keys: dto.PushSubscriptionKeys{
			P256dh: "p256dh-key",
			Auth:   "auth-key",
		},
	}

	mockRepo.On("SaveSubscription", ctx, mock.AnythingOfType("model.PushSubscription")).Return(nil)

	err := service.SavePushSubscription(ctx, userID, input)

	assert.Nil(t, err)
	mockRepo.AssertExpectations(t)
}

func TestSavePushSubscription_Error(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	userID := "user1"

	input := dto.PushSubscription{
		Endpoint: "https://fcm.googleapis.com/endpoint",
		Keys: dto.PushSubscriptionKeys{
			P256dh: "p256dh-key",
			Auth:   "auth-key",
		},
	}

	mockRepo.On("SaveSubscription", ctx, mock.AnythingOfType("model.PushSubscription")).Return(errors.New("database error"))

	err := service.SavePushSubscription(ctx, userID, input)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "database error")
	mockRepo.AssertExpectations(t)
}

// --- TESTS PushClientPublicKey ---

func TestPushClientPublicKey_Success(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	expectedKey := "public-key-123"
	mockPush.On("PublicKey").Return(expectedKey)

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	result := service.PushClientPublicKey()

	assert.Equal(t, expectedKey, result)
	mockPush.AssertExpectations(t)
}

// --- TESTS GetPushClient ---

func TestGetPushClient_Success(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	// Use a real PushClient for this test since GetPushClient returns *push.PushClient
	realPushClient := push.NewPushClient("test-public-key", "test-private-key")

	service := services.NewChatService(mockRepo, mockHub, realPushClient)

	result := service.GetPushClient()

	assert.Equal(t, realPushClient, result)
	assert.Equal(t, "test-public-key", result.PublicKey())
}

// --- TESTS RepoDeleteSubscription ---

func TestRepoDeleteSubscription_Success(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	endpoint := "https://fcm.googleapis.com/endpoint"

	mockRepo.On("DeleteSubscription", ctx, endpoint).Return(nil)

	err := service.RepoDeleteSubscription(ctx, endpoint)

	assert.Nil(t, err)
	mockRepo.AssertExpectations(t)
}

func TestRepoDeleteSubscription_Error(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	endpoint := "https://fcm.googleapis.com/endpoint"

	mockRepo.On("DeleteSubscription", ctx, endpoint).Return(errors.New("database error"))

	err := service.RepoDeleteSubscription(ctx, endpoint)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "database error")
	mockRepo.AssertExpectations(t)
}

// --- TESTS SendMessage con Push Notifications ---

func TestSendMessage_Success_WithPushNotifications(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	receiverID := "user2"
	postID := "post123"
	chatID := primitive.NewObjectID()

	chat := createTestChat(chatID, senderID, receiverID, postID)
	expectedMessage := createTestMessage(primitive.NewObjectID(), chatID, senderID, "Hello")

	subscriptions := []model.PushSubscription{
		{
			ID:       primitive.NewObjectID(),
			UserID:   receiverID,
			Endpoint: "https://fcm.googleapis.com/endpoint1",
			Keys: model.PushSubscriptionKeys{
				P256dh: "key1",
				Auth:   "auth1",
			},
		},
	}

	mockRepo.On("GetChat", ctx, chatID.Hex()).Return(chat, nil)
	mockRepo.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(expectedMessage, nil)
	mockHub.On("HasConnections", receiverID).Return(false)
	mockHub.On("SendToUser", receiverID, mock.Anything).Return()
	mockRepo.On("ListSubscriptions", ctx, receiverID).Return(subscriptions, nil)
	// Mock SendNotifications to return empty slice (no failures), but if it fails, mock DeleteSubscription
	mockPush.On("SendNotifications", ctx, subscriptions, mock.AnythingOfType("[]uint8")).Return([]string{})
	// Also mock DeleteSubscription in case SendNotifications returns failures (defensive)
	mockRepo.On("DeleteSubscription", ctx, mock.AnythingOfType("string")).Return(nil).Maybe()

	input := dto.WSMessage{
		ChatID:  chatID.Hex(),
		Content: "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.Nil(t, err)
	assert.Equal(t, expectedMessage.ID, result.ID)
	mockRepo.AssertExpectations(t)
	mockHub.AssertExpectations(t)
	mockPush.AssertExpectations(t)
}

func TestSendMessage_Success_PushNotificationsWithFailures(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	receiverID := "user2"
	postID := "post123"
	chatID := primitive.NewObjectID()

	chat := createTestChat(chatID, senderID, receiverID, postID)
	expectedMessage := createTestMessage(primitive.NewObjectID(), chatID, senderID, "Hello")

	subscriptions := []model.PushSubscription{
		{
			ID:       primitive.NewObjectID(),
			UserID:   receiverID,
			Endpoint: "https://fcm.googleapis.com/endpoint1",
			Keys: model.PushSubscriptionKeys{
				P256dh: "key1",
				Auth:   "auth1",
			},
		},
		{
			ID:       primitive.NewObjectID(),
			UserID:   receiverID,
			Endpoint: "https://fcm.googleapis.com/endpoint2",
			Keys: model.PushSubscriptionKeys{
				P256dh: "key2",
				Auth:   "auth2",
			},
		},
	}

	failedEndpoints := []string{"https://fcm.googleapis.com/endpoint2"}

	mockRepo.On("GetChat", ctx, chatID.Hex()).Return(chat, nil)
	mockRepo.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(expectedMessage, nil)
	mockHub.On("HasConnections", receiverID).Return(false)
	mockHub.On("SendToUser", receiverID, mock.Anything).Return()
	mockRepo.On("ListSubscriptions", ctx, receiverID).Return(subscriptions, nil)
	mockPush.On("SendNotifications", ctx, subscriptions, mock.AnythingOfType("[]uint8")).Return(failedEndpoints)
	mockRepo.On("DeleteSubscription", ctx, "https://fcm.googleapis.com/endpoint2").Return(nil)

	input := dto.WSMessage{
		ChatID:  chatID.Hex(),
		Content: "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.Nil(t, err)
	assert.Equal(t, expectedMessage.ID, result.ID)
	mockRepo.AssertExpectations(t)
	mockPush.AssertExpectations(t)
}

// --- TESTS Table-Driven para diferentes escenarios de SendMessage ---

func TestSendMessage_TableDriven(t *testing.T) {
	tests := []struct {
		name           string
		senderID       string
		input          dto.WSMessage
		setupMocks     func(*mockRepository, *mockHubWrapper, *mockPushClientWrapper, context.Context, dto.WSMessage)
		expectedError  string
		expectedResult bool
	}{
		{
			name:     "success_with_chatid",
			senderID: "user1",
			input: dto.WSMessage{
				ChatID:  primitive.NewObjectID().Hex(),
				Content: "Test message",
			},
			setupMocks: func(mr *mockRepository, mh *mockHubWrapper, mp *mockPushClientWrapper, ctx context.Context, input dto.WSMessage) {
				// Usar el mismo chatID del input
				chatID, _ := primitive.ObjectIDFromHex(input.ChatID)
				chat := createTestChat(chatID, "user1", "user2", "post123")
				mr.On("GetChat", ctx, input.ChatID).Return(chat, nil)
				mr.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(
					createTestMessage(primitive.NewObjectID(), chatID, "user1", "Test message"), nil)
				mh.On("HasConnections", "user2").Return(false)
				mh.On("SendToUser", "user2", mock.Anything).Return()
				mr.On("ListSubscriptions", ctx, "user2").Return([]model.PushSubscription{}, nil)
			},
			expectedResult: true,
		},
		{
			name:     "success_with_receiver_and_post",
			senderID: "user1",
			input: dto.WSMessage{
				ReceiverID: "user2",
				PostID:     "post123",
				Content:    "Test message",
			},
			setupMocks: func(mr *mockRepository, mh *mockHubWrapper, mp *mockPushClientWrapper, ctx context.Context, input dto.WSMessage) {
				chatID := primitive.NewObjectID()
				chat := createTestChat(chatID, "user1", "user2", input.PostID)
				mr.On("FindOrCreateChat", ctx, "user1", input.ReceiverID, input.PostID).Return(chat, nil)
				mr.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(
					createTestMessage(primitive.NewObjectID(), chatID, "user1", input.Content), nil)
				mh.On("HasConnections", input.ReceiverID).Return(false)
				mh.On("SendToUser", input.ReceiverID, mock.Anything).Return()
				mr.On("ListSubscriptions", ctx, input.ReceiverID).Return([]model.PushSubscription{}, nil)
			},
			expectedResult: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockRepo := new(mockRepository)
			mockHub := newMockHub()
			mockPush := newMockPushClient()

			service := services.NewChatService(mockRepo, mockHub, mockPush)
			ctx := context.Background()

			tt.setupMocks(mockRepo, mockHub, mockPush, ctx, tt.input)

			result, err := service.SendMessage(ctx, tt.senderID, tt.input)

			if tt.expectedError != "" {
				assert.NotNil(t, err)
				assert.Contains(t, err.Error(), tt.expectedError)
			} else {
				assert.Nil(t, err)
				if tt.expectedResult {
					assert.NotEqual(t, primitive.NilObjectID, result.ID)
				}
			}
			mockRepo.AssertExpectations(t)
		})
	}
}

// --- TESTS adicionales para aumentar coverage ---

func TestGetPushClient_ReturnsNil_WhenNotPushClient(t *testing.T) {
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	// Usar un mockPushClient que NO es *push.PushClient real
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	result := service.GetPushClient()

	// Como mockPush es un wrapper, no es directamente *push.PushClient
	// Entonces debería devolver nil
	assert.Nil(t, result)
}

func TestSendMessage_Success_WhenSenderIsParticipant1(t *testing.T) {
	// Test cuando el sender es Participants[1], no Participants[0]
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user2"   // sender será Participants[1]
	receiverID := "user1" // receiver será Participants[0]
	chatID := primitive.NewObjectID()
	postID := "post123"

	// Crear chat donde Participants[0] = user1, Participants[1] = user2
	chat := createTestChat(chatID, receiverID, senderID, postID)
	expectedMessage := createTestMessage(primitive.NewObjectID(), chatID, senderID, "Hello")

	mockRepo.On("GetChat", ctx, chatID.Hex()).Return(chat, nil)
	mockRepo.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(expectedMessage, nil)
	mockHub.On("HasConnections", receiverID).Return(false)
	mockHub.On("SendToUser", receiverID, mock.Anything).Return()
	mockRepo.On("ListSubscriptions", ctx, receiverID).Return([]model.PushSubscription{}, nil)

	input := dto.WSMessage{
		ChatID:  chatID.Hex(),
		Content: "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.Nil(t, err)
	assert.Equal(t, expectedMessage.ID, result.ID)
	assert.Equal(t, "Hello", result.Content)
	mockRepo.AssertExpectations(t)
	mockHub.AssertExpectations(t)
}

func TestSendMessage_Success_WhenListSubscriptionsFails(t *testing.T) {
	// Test que ListSubscriptions puede fallar pero no rompe el flujo
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	receiverID := "user2"
	chatID := primitive.NewObjectID()
	postID := "post123"

	chat := createTestChat(chatID, senderID, receiverID, postID)
	expectedMessage := createTestMessage(primitive.NewObjectID(), chatID, senderID, "Hello")

	mockRepo.On("GetChat", ctx, chatID.Hex()).Return(chat, nil)
	mockRepo.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(expectedMessage, nil)
	mockHub.On("HasConnections", receiverID).Return(false)
	mockHub.On("SendToUser", receiverID, mock.Anything).Return()
	// ListSubscriptions falla pero el flujo continúa
	mockRepo.On("ListSubscriptions", ctx, receiverID).Return(([]model.PushSubscription)(nil), errors.New("db error"))

	input := dto.WSMessage{
		ChatID:  chatID.Hex(),
		Content: "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	// El error de ListSubscriptions no debe romper el flujo
	assert.Nil(t, err)
	assert.Equal(t, expectedMessage.ID, result.ID)
	mockRepo.AssertExpectations(t)
	mockHub.AssertExpectations(t)
}

func TestSendMessage_Error_GetChatFailsNoFallback(t *testing.T) {
	// Test cuando GetChat falla y NO hay fallback (no vienen receiverID + postID)
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	chatID := primitive.NewObjectID()

	mockRepo.On("GetChat", ctx, chatID.Hex()).Return(model.Chat{}, errors.New("chat not found"))

	input := dto.WSMessage{
		ChatID:  chatID.Hex(),
		Content: "Hello",
		// No viene receiverID ni postID, así que no hay fallback
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "chatId inválido o no existe")
	assert.Equal(t, primitive.NilObjectID, result.ID)
	mockRepo.AssertExpectations(t)
}

func TestSendMessage_Success_WithPushNotifications_MultipleSubs(t *testing.T) {
	// Test con múltiples suscripciones y algunas fallan
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	receiverID := "user2"
	postID := "post123"
	chatID := primitive.NewObjectID()

	chat := createTestChat(chatID, senderID, receiverID, postID)
	expectedMessage := createTestMessage(primitive.NewObjectID(), chatID, senderID, "Hello")

	subscriptions := []model.PushSubscription{
		{
			ID:       primitive.NewObjectID(),
			UserID:   receiverID,
			Endpoint: "https://fcm.googleapis.com/endpoint1",
			Keys: model.PushSubscriptionKeys{
				P256dh: "key1",
				Auth:   "auth1",
			},
		},
		{
			ID:       primitive.NewObjectID(),
			UserID:   receiverID,
			Endpoint: "https://fcm.googleapis.com/endpoint2",
			Keys: model.PushSubscriptionKeys{
				P256dh: "key2",
				Auth:   "auth2",
			},
		},
		{
			ID:       primitive.NewObjectID(),
			UserID:   receiverID,
			Endpoint: "https://fcm.googleapis.com/endpoint3",
			Keys: model.PushSubscriptionKeys{
				P256dh: "key3",
				Auth:   "auth3",
			},
		},
	}

	// Solo endpoint2 falla
	failedEndpoints := []string{"https://fcm.googleapis.com/endpoint2"}

	mockRepo.On("GetChat", ctx, chatID.Hex()).Return(chat, nil)
	mockRepo.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(expectedMessage, nil)
	mockHub.On("HasConnections", receiverID).Return(false)
	mockHub.On("SendToUser", receiverID, mock.Anything).Return()
	mockRepo.On("ListSubscriptions", ctx, receiverID).Return(subscriptions, nil)
	mockPush.On("SendNotifications", ctx, subscriptions, mock.AnythingOfType("[]uint8")).Return(failedEndpoints)
	mockRepo.On("DeleteSubscription", ctx, "https://fcm.googleapis.com/endpoint2").Return(nil)

	input := dto.WSMessage{
		ChatID:  chatID.Hex(),
		Content: "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.Nil(t, err)
	assert.Equal(t, expectedMessage.ID, result.ID)
	mockRepo.AssertExpectations(t)
	mockHub.AssertExpectations(t)
	mockPush.AssertExpectations(t)
}

func TestSendMessage_Success_UserOnline_WithPushEnabled(t *testing.T) {
	// Test que aunque el usuario esté online, con sendPushEvenIfOnline=true,
	// se enviaría push también. Verifica que ListSubscriptions se llama incluso cuando el usuario está online.
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	receiverID := "user2"
	postID := "post123"
	chatID := primitive.NewObjectID()

	chat := createTestChat(chatID, senderID, receiverID, postID)
	expectedMessage := createTestMessage(primitive.NewObjectID(), chatID, senderID, "Hello")

	subscriptions := []model.PushSubscription{
		{
			ID:       primitive.NewObjectID(),
			UserID:   receiverID,
			Endpoint: "https://fcm.googleapis.com/endpoint1",
			Keys: model.PushSubscriptionKeys{
				P256dh: "key1",
				Auth:   "auth1",
			},
		},
	}

	mockRepo.On("GetChat", ctx, chatID.Hex()).Return(chat, nil)
	mockRepo.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(expectedMessage, nil)
	mockHub.On("HasConnections", receiverID).Return(true) // Usuario online
	mockHub.On("SendToUser", receiverID, mock.Anything).Return()
	mockRepo.On("ListSubscriptions", ctx, receiverID).Return(subscriptions, nil)
	mockPush.On("SendNotifications", ctx, subscriptions, mock.AnythingOfType("[]uint8")).Return([]string{})

	input := dto.WSMessage{
		ChatID:  chatID.Hex(),
		Content: "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.Nil(t, err)
	assert.Equal(t, expectedMessage.ID, result.ID)
	// Con sendPushEvenIfOnline=true, ListSubscriptions debe ser llamado incluso cuando el usuario está online
	mockRepo.AssertExpectations(t)
	mockHub.AssertExpectations(t)
	mockPush.AssertExpectations(t)
}

func TestSendMessage_Success_WithEmptySubscriptionsList(t *testing.T) {
	// Test cuando hay suscripciones pero la lista está vacía
	mockRepo := new(mockRepository)
	mockHub := newMockHub()
	mockPush := newMockPushClient()

	service := services.NewChatService(mockRepo, mockHub, mockPush)

	ctx := context.Background()
	senderID := "user1"
	receiverID := "user2"
	postID := "post123"
	chatID := primitive.NewObjectID()

	chat := createTestChat(chatID, senderID, receiverID, postID)
	expectedMessage := createTestMessage(primitive.NewObjectID(), chatID, senderID, "Hello")

	mockRepo.On("GetChat", ctx, chatID.Hex()).Return(chat, nil)
	mockRepo.On("SaveMessage", ctx, mock.AnythingOfType("model.Message")).Return(expectedMessage, nil)
	mockHub.On("HasConnections", receiverID).Return(false)
	mockHub.On("SendToUser", receiverID, mock.Anything).Return()
	mockRepo.On("ListSubscriptions", ctx, receiverID).Return([]model.PushSubscription{}, nil)

	input := dto.WSMessage{
		ChatID:  chatID.Hex(),
		Content: "Hello",
	}

	result, err := service.SendMessage(ctx, senderID, input)

	assert.Nil(t, err)
	assert.Equal(t, expectedMessage.ID, result.ID)
	// No debería llamar a SendNotifications porque no hay suscripciones
	mockPush.AssertNotCalled(t, "SendNotifications")
	mockRepo.AssertExpectations(t)
	mockHub.AssertExpectations(t)
}
