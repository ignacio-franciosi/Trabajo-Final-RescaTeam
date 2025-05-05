package model

type AdoptionPost struct {
	AdoptionPostId   int    `gorm:"primaryKey"`
	UserId           int    `gorm:"type:integer;not null"`
	Name             string `gorm:"type:varchar(250);not null"`
	Species          string `gorm:"type:varchar(250);not null"`
	Age              int    `gorm:"type:integer;not null"`
	Breed            string `gorm:"type:varchar(250);not null"`
	Color            string `gorm:"type:varchar(250);not null"`
	Size             string `gorm:"type:varchar(250);not null"`
	Sex              string `gorm:"type:varchar(250);not null"`
	Description      string `gorm:"type:varchar(1000);not null"`
	Neutered         bool   `gorm:"type:boolean;not null"`
	CompleteVaccines bool   `gorm:"type:boolean;not null"`
	AdoptionStatus   bool   `gorm:"type:boolean;not null"`
	Date             string `gorm:"type:varchar(16);not null"`
	Zone             string `gorm:"type:varchar(250);not null"`
}

type AdoptionPosts []AdoptionPost
