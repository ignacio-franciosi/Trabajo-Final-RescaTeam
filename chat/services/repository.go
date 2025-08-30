package services

import (
	"chat/model"
	"context"
)

type Repository interface {
	FindOrCreateChat(ctx context.Context, me, other, postID string) (model.Chat, error)
	GetChat(ctx context.Context, chatID string) (model.Chat, error)
	ListChats(ctx context.Context, me string, limit int64) ([]model.Chat, error)
	SaveMessage(ctx context.Context, m model.Message) (model.Message, error)
	ListMessages(ctx context.Context, chatID string, limit int64) ([]model.Message, error)
	MarkRead(ctx context.Context, chatID, userID string) error
}
