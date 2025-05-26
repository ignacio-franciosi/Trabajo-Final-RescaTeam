package dto

type UpdateUserDto struct {
	UserId  int    `json:"id_user"`
	Name    string `json:"name"`
	Surname string `json:"surname"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
}

type UpdateUsersDto []UpdateUserDto
