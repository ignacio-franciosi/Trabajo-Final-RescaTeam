package model

type User struct {
	UserId    int    `gorm:"primaryKey"`
	Name      string `gorm:"type:varchar(300);not null"`
	Surname   string `gorm:"type:varchar(300);not null"`
	Dni       int    `gorm:"type int;not null"`
	Email     string `gorm:"type:varchar(500);not null;unique"`
	Phone     string `gorm:"type:varchar(30);not null"`
	Password  string `gorm:"type:varchar(200);not null"`
	Type      bool   `gorm:"type:boolean;not null"` // True admin, False not admin
	Suspended bool   `gorm:"type:boolean;not null"`
}

type Users []User
