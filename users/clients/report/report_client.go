package report

import (
	"users/model"

	log "github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type reportClient struct{}

type reportClientInterface interface {
	InsertReport(report model.Report) model.Report
	GetReportById(reportId int) model.Report
	GetAllReports() (model.Reports, error)
	GetReportsByUserId(userid int) (model.Reports, error)
	GetReportsByComplainingUserId(complainingUserId int) (model.Reports, error)
	UpdateReport(report model.Report) (model.Report, error)
	DeleteReport(report model.Report) error
	

}

var ReportClient reportClientInterface

var Db *gorm.DB

func init() {
	ReportClient = &reportClient{}
}

func (c *reportClient) InsertReport(report model.Report) model.Report {
	result := Db.Create(&report)

	if result.Error != nil {
		log.Error("Couldn't create report")
		return model.Report{}
	}
	log.Debug("Report Created: ", report.ReportId)

	return report
}
func (c *reportClient) GetReportById(reportId int) model.Report {
	var report model.Report
	Db.Where("report_id = ?", reportId).First(&report)
	log.Debug("Report: ", report)

	return report
}

func (c *reportClient) GetAllReports() (model.Reports, error) {
	var reports model.Reports
	result := Db.Find(&reports)
	if result.Error != nil {
		return nil, result.Error
	}
	return reports, nil
}

func (c *reportClient) GetReportsByUserId(userId int) (model.Reports, error) {
	var reports model.Reports
	result := Db.Where("user_id = ?", userId).Find(&reports)
	if result.Error != nil {
		return nil, result.Error
	}
	return reports, nil
}

func (c *reportClient) GetReportsByComplainingUserId(complainingUserId int) (model.Reports, error) {
	var reports model.Reports
	result := Db.Where("complaining_user_id = ?", complainingUserId).Find(&reports)
	if result.Error != nil {
		return nil, result.Error
	}
	return reports, nil
}

func (c *reportClient) UpdateReport(report model.Report) (model.Report, error) {
	result := Db.Model(&model.Report{}).
		Where("report_id = ?", report.ReportId).
		Updates(map[string]any{
			"admin_comment": report.AdminComment,
			"report_status": report.ReportStatus,
		})

	if result.Error != nil {
		return model.Report{}, result.Error
	}

	var updatedReport model.Report
	err := Db.Where("report_id = ?", report.ReportId).First(&updatedReport).Error
	if err != nil {
		return model.Report{}, err
	}

	return updatedReport, nil
}

func (c *reportClient) DeleteReport(report model.Report) error {
	err := Db.Delete(&report).Error

	if err != nil {
		log.Debug("Failed to delete report")
	} else {
		log.Debug("Report deleted: ", report.ReportId)
	}
	return err
}


