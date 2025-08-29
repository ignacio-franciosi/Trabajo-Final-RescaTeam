package services

import (
	"encoding/json"
	"sync"
)

// Conn sería tu wrapper de websocket.Conn (lo definiremos en la capa WS)
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
}

func (h *Hub) SendToUser(userID string, v interface{}) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if conns, ok := h.conns[userID]; ok {
		data, _ := json.Marshal(v)
		for c := range conns {
			_ = c.WriteJSON(json.RawMessage(data)) // mejor manejo de error luego
		}
	}
}
