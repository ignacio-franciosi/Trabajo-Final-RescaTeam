package dto

type ResetPasswordDto struct {
	Token        string `json:"token"`
	NewPassword1 string `json:"new_password_1"`
	NewPassword2 string `json:"new_password_2"`
}
