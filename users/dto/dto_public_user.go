package dto

type PublicUserDto struct {
	Phone string `json:"phone"`
}

type PublicUsersDto []PublicUserDto
