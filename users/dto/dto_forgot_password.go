package dto

type ForgotPasswordRequestDto struct {
	Email string `json:"email" binding:"required,email"`
}
