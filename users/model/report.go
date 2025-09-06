package model

type Report struct {
	ReportId          int     `gorm:"primaryKey"`
	UserId            int     `gorm:"type int;not null"`
	PostId            string  `gorm:"type:varchar(300);not null"`
	ComplainingUserId int     `gorm:"type int;not null"`
	Reason            string  `gorm:"type:varchar(300);not null"`
	Comment           string  `gorm:"type:varchar(500);not null"`
	AdminComment      *string `gorm:"type:varchar(300)"`
	ReportStatus      string  `gorm:"type:varchar(200);not null"`
	Date              string  `gorm:"type:varchar(200);not null"`
}

type Reports []Report
