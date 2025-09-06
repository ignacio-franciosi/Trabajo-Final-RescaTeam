package dto

type ReportDto struct {
	ReportId          int     `json:"reportId"`
	UserId            int     `json:"id_user"`
	PostId            string  `json:"postId"`
	ComplainingUserId int     `json:"complainingUserId"`
	Reason            string  `json:"reason"`
	Comment           string  `json:"comment"`
	AdminComment      *string `json:"adminComment"`
	ReportStatus      string  `json:"reportStatus"`
	Date              string  `json:"date"`
}

type ReportsDto []ReportDto
