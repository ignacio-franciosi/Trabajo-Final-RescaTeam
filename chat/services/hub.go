package services

import (
	"chat/model"
	"encoding/json"
	"log"
	"sync"
)

// Conn es la interfaz que envuelve a *websocket.Conn
type Conn interface {
	WriteJSON(v interface{}) error
	Close() error
}

type Hub struct {
	mu    sync.RWMutex
	conns map[string]map[Conn]struct{} // userID -> set de conexiones activas
}

func NewHub() *Hub {
	return &Hub{
		conns: make(map[string]map[Conn]struct{}),
	}
}

func (h *Hub) AddConnection(userID string, c Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.conns[userID] == nil {
		h.conns[userID] = make(map[Conn]struct{})
	}
	h.conns[userID][c] = struct{}{}
	log.Printf("[Hub] conexión añadida para user=%s (total=%d)", userID, len(h.conns[userID]))
}

func (h *Hub) RemoveConnection(userID string, c Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if conns, ok := h.conns[userID]; ok {
		delete(conns, c)
		if len(conns) == 0 {
			delete(h.conns, userID)
		}
	}
	log.Printf("[Hub] conexión eliminada para user=%s", userID)
}

func (h *Hub) SendToUser(userID string, v interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	conns, ok := h.conns[userID]
	if !ok {
		return
	}

	data, err := json.Marshal(v)
	if err != nil {
		log.Printf("[Hub] error serializando mensaje: %v", err)
		return
	}

	for c := range conns {
		if err := c.WriteJSON(json.RawMessage(data)); err != nil {
			log.Printf("[Hub] error enviando a user=%s: %v", userID, err)
			_ = c.Close()
			// Podríamos remover la conexión rota en un goroutine
			go h.RemoveConnection(userID, c)
		}
	}
}

func (h *Hub) HasConnections(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	conns, ok := h.conns[userID]
	return ok && len(conns) > 0
}

// verificar si un user es parte de un chat
func (h *Hub) IsUserInChat(userID string, chat model.Chat) bool {
	for _, p := range chat.Participants {
		if p == userID {
			return true
		}
	}
	return false
}
