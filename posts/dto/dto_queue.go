package dto

type QueueMessageDto struct {
	Id      int    `json:"id"`
	Message string `json:"message"`
}

type QueueMessagesDto []QueueMessageDto

type PostSearchMessageDto struct {
	PostId    string `json:"post_id"`
	PostType  string `json:"post_type"`
	ImageUrl  string `json:"image_url"`
}
