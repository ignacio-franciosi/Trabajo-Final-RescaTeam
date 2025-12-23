package services_test

import (
	"errors"
	"testing"

	"chat/model"
	"chat/services"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// mockConn implementa la interfaz Conn para testing
type mockConn struct {
	mock.Mock
	writeJSONData []interface{}
	closeCalled   bool
}

func (m *mockConn) WriteJSON(v interface{}) error {
	args := m.Called(v)
	m.writeJSONData = append(m.writeJSONData, v)
	return args.Error(0)
}

func (m *mockConn) Close() error {
	args := m.Called()
	m.closeCalled = true
	return args.Error(0)
}

func TestHub_AddConnection(t *testing.T) {
	hub := services.NewHub()
	conn1 := new(mockConn)
	conn2 := new(mockConn)

	userID := "user1"

	// Primera conexión
	hub.AddConnection(userID, conn1)
	assert.True(t, hub.HasConnections(userID))

	// Segunda conexión para el mismo usuario
	hub.AddConnection(userID, conn2)
	assert.True(t, hub.HasConnections(userID))

	// Verificar que ambas conexiones están registradas
	// (no hay forma directa de verificar el count, pero HasConnections confirma que hay conexiones)
}

func TestHub_RemoveConnection(t *testing.T) {
	hub := services.NewHub()
	conn1 := new(mockConn)
	conn2 := new(mockConn)

	userID := "user1"

	// Agregar dos conexiones
	hub.AddConnection(userID, conn1)
	hub.AddConnection(userID, conn2)
	assert.True(t, hub.HasConnections(userID))

	// Remover una conexión
	hub.RemoveConnection(userID, conn1)
	assert.True(t, hub.HasConnections(userID)) // Todavía hay conn2

	// Remover la última conexión
	hub.RemoveConnection(userID, conn2)
	assert.False(t, hub.HasConnections(userID)) // Ya no hay conexiones
}

func TestHub_HasConnections(t *testing.T) {
	hub := services.NewHub()
	conn := new(mockConn)

	userID1 := "user1"
	userID2 := "user2"

	// Inicialmente no hay conexiones
	assert.False(t, hub.HasConnections(userID1))
	assert.False(t, hub.HasConnections(userID2))

	// Agregar conexión para user1
	hub.AddConnection(userID1, conn)
	assert.True(t, hub.HasConnections(userID1))
	assert.False(t, hub.HasConnections(userID2))

	// Remover conexión
	hub.RemoveConnection(userID1, conn)
	assert.False(t, hub.HasConnections(userID1))
}

func TestHub_SendToUser(t *testing.T) {
	hub := services.NewHub()
	conn1 := new(mockConn)
	conn2 := new(mockConn)

	userID := "user1"
	message := map[string]string{"type": "test", "data": "hello"}

	// Agregar conexiones
	hub.AddConnection(userID, conn1)
	hub.AddConnection(userID, conn2)

	// Mockear WriteJSON para ambas conexiones
	conn1.On("WriteJSON", mock.Anything).Return(nil)
	conn2.On("WriteJSON", mock.Anything).Return(nil)

	// Enviar mensaje
	hub.SendToUser(userID, message)

	// Verificar que WriteJSON fue llamado en ambas conexiones
	conn1.AssertExpectations(t)
	conn2.AssertExpectations(t)
}

func TestHub_SendToUser_NoConnections(t *testing.T) {
	hub := services.NewHub()
	message := map[string]string{"type": "test"}

	// Intentar enviar a usuario sin conexiones (no debe hacer nada)
	hub.SendToUser("nonexistent", message)
	// No debería fallar ni hacer nada
}

func TestHub_SendToUser_JSONMarshalError(t *testing.T) {
	hub := services.NewHub()
	conn := new(mockConn)

	userID := "user1"
	// Crear un tipo que no se puede serializar a JSON (canal)
	invalidMessage := make(chan int)

	hub.AddConnection(userID, conn)

	// Enviar mensaje inválido (no debería llamar WriteJSON)
	hub.SendToUser(userID, invalidMessage)

	// WriteJSON no debería ser llamado porque Marshal falla
	conn.AssertNotCalled(t, "WriteJSON")
}

func TestHub_SendToUser_WriteJSONError(t *testing.T) {
	hub := services.NewHub()
	conn := new(mockConn)

	userID := "user1"
	message := map[string]string{"type": "test"}

	hub.AddConnection(userID, conn)

	// Mockear WriteJSON para que falle
	conn.On("WriteJSON", mock.Anything).Return(errors.New("write error"))
	conn.On("Close").Return(nil)

	// Enviar mensaje
	hub.SendToUser(userID, message)

	// Verificar que se intentó cerrar la conexión
	conn.AssertExpectations(t)
	assert.True(t, conn.closeCalled)
}

func TestHub_IsUserInChat(t *testing.T) {
	hub := services.NewHub()

	chat := model.Chat{
		Participants: [2]string{"user1", "user2"},
	}

	// Test cuando el usuario está en el chat
	assert.True(t, hub.IsUserInChat("user1", chat))
	assert.True(t, hub.IsUserInChat("user2", chat))

	// Test cuando el usuario NO está en el chat
	assert.False(t, hub.IsUserInChat("user3", chat))
	assert.False(t, hub.IsUserInChat("", chat))
}

func TestHub_MultipleUsers(t *testing.T) {
	hub := services.NewHub()

	conn1 := new(mockConn)
	conn2 := new(mockConn)
	conn3 := new(mockConn)

	// Agregar conexiones para diferentes usuarios
	hub.AddConnection("user1", conn1)
	hub.AddConnection("user2", conn2)
	hub.AddConnection("user3", conn3)

	// Verificar que todos tienen conexiones
	assert.True(t, hub.HasConnections("user1"))
	assert.True(t, hub.HasConnections("user2"))
	assert.True(t, hub.HasConnections("user3"))

	// Remover conexión de user2
	hub.RemoveConnection("user2", conn2)
	assert.False(t, hub.HasConnections("user2"))
	assert.True(t, hub.HasConnections("user1"))
	assert.True(t, hub.HasConnections("user3"))
}
