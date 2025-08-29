package dto

// Mensajes que llegan desde el cliente vía WS
type WSIncoming struct {
	Type    string    `json:"type"` // ej: "send_message"
	Payload WSMessage `json:"payload"`
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
