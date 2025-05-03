package dto

type UserDto struct {
	UserId    int    `json:"id_user"`
	Name      string `json:"name"`
	Surname   string `json:"surname"`
	Dni       int    `json:"dni"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Type      bool   `json:"type"`
	Suspended bool   `json:"suspended"`
}

type UsersDto []UserDto
