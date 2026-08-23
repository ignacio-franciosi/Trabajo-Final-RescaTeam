package dto

type PublicUserDto struct {
	Phone string `json:"phone"`
}

type PublicUsersDto []PublicUserDto

type PublicUserNameDto struct {
	UserId  int    `json:"id_user"`
	Name    string `json:"name"`
	Surname string `json:"surname"`
}
