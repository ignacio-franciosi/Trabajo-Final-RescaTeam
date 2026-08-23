package dto

import "encoding/json"

// Mensajes que llegan desde el cliente vía WS
// Type: "send_message" | "chat:active"
type WSIncoming struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// Mensajes que el servidor envía de vuelta
type WSOutgoing struct {
	Type    string      `json:"type"` // ej: "message" | "ack" | "error"
	Payload interface{} `json:"payload"`
}

// Datos de un mensaje entrante
type WSMessage struct {
	ChatID     string `json:"chatId"`
	ReceiverID string `json:"receiverId"`
	PostID     string `json:"postId"`
	Content    string `json:"content"`
}

// Payload para informar que un chat está activo/visible
type WSChatActive struct {
	ChatID string `json:"chatId"`
}
