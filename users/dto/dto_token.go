package dto

type TokenDto struct {
	Token     string `json:"token"`
	UserId    int    `json:"id_user"`
	Type      bool   `json:"type"`
	Suspended bool   `json:"suspended"`
}
