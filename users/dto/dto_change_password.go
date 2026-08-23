package dto

type ChangePasswordDto struct {
	UserId       int    `json:"id_user"`
	OldPassword  string `json:"old_password"`
	NewPassword1 string `json:"new_password_1"`
	NewPassword2 string `json:"new_password_2"`
}
