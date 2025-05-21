package model

type AdoptionImage struct {
	ImageId        int    `gorm:"primaryKey" json:"image_id"`
	AdoptionPostId int    `gorm:"type:integer;not null"`
	FilePath       string `gorm:"type:varchar(250);not null"`
}

type AdoptionImages []AdoptionImage
