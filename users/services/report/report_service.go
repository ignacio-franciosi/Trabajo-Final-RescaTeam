package report

import (
	"errors"
	"time"
	"users/clients/report"
	"users/dto"
	"users/model"
)

type reportService struct{}

type reportServiceInterface interface {
	InsertReport(reportDto dto.ReportDto) (dto.ReportDto, error)
	GetReportById(reportId int) (dto.ReportDto, error)
	GetAllReports() ([]dto.ReportDto, error)
	GetReportsByUserId(userId int) ([]dto.ReportDto, error)
	GetReportsByComplainingUserId(complainingUserId int) ([]dto.ReportDto, error)
	UpdateReport(updateDto dto.ReportDto) (dto.ReportDto, error)
	DeleteReport(reportId int) error
}

var ReportService reportServiceInterface

func init() {
	ReportService = &reportService{}
}

func (s *reportService) InsertReport(reportDto dto.ReportDto) (dto.ReportDto, error) {
	reportModel := model.Report{
		UserId:            reportDto.UserId,
		ComplainingUserId: reportDto.ComplainingUserId,
		PostId:            reportDto.PostId,
		Reason:            reportDto.Reason,
		Comment:           reportDto.Comment,
		ReportStatus:      "pending",                       
		Date:              time.Now().Format(time.RFC3339), 
		AdminComment:      nil,                             
	}

	created := report.ReportClient.InsertReport(reportModel)
	if created.ReportId == 0 {
		return dto.ReportDto{}, errors.New("no se pudo crear el reporte")
	}

	return dto.ReportDto{
		ReportId:          created.ReportId,
		UserId:            created.UserId,
		PostId:            created.PostId,
		ComplainingUserId: created.ComplainingUserId,
		Reason:            created.Reason,
		Comment:           created.Comment,
		AdminComment:      created.AdminComment,
		ReportStatus:      created.ReportStatus,
		Date:              created.Date,
	}, nil
}

func (s *reportService) GetReportById(reportId int) (dto.ReportDto, error) {
	rep := report.ReportClient.GetReportById(reportId)
	if rep.ReportId == 0 {
		return dto.ReportDto{}, errors.New("reporte no encontrado")
	}

	return dto.ReportDto{
		ReportId:          rep.ReportId,
		UserId:            rep.UserId,
		PostId:            rep.PostId,
		ComplainingUserId: rep.ComplainingUserId,
		Reason:            rep.Reason,
		Comment:           rep.Comment,
		AdminComment:      rep.AdminComment,
		ReportStatus:      rep.ReportStatus,
		Date:              rep.Date,
	}, nil
}

func (s *reportService) GetAllReports() ([]dto.ReportDto, error) {
	reports, err := report.ReportClient.GetAllReports()
	if err != nil {
		return nil, err
	}

	var reportsDto []dto.ReportDto
	for _, r := range reports {
		reportsDto = append(reportsDto, dto.ReportDto{
			ReportId:          r.ReportId,
			UserId:            r.UserId,
			PostId:            r.PostId,
			ComplainingUserId: r.ComplainingUserId,
			Reason:            r.Reason,
			Comment:           r.Comment,
			AdminComment:      r.AdminComment,
			ReportStatus:      r.ReportStatus,
			Date:              r.Date,
		})
	}
	return reportsDto, nil
}

func (s *reportService) GetReportsByUserId(userId int) ([]dto.ReportDto, error) {
	reports, err := report.ReportClient.GetReportsByUserId(userId)
	if err != nil {
		return nil, err
	}

	var reportsDto []dto.ReportDto
	for _, r := range reports {
		reportsDto = append(reportsDto, dto.ReportDto{
			ReportId:          r.ReportId,
			UserId:            r.UserId,
			PostId:            r.PostId,
			ComplainingUserId: r.ComplainingUserId,
			Reason:            r.Reason,
			Comment:           r.Comment,
			AdminComment:      r.AdminComment,
			ReportStatus:      r.ReportStatus,
			Date:              r.Date,
		})
	}
	return reportsDto, nil
}

func (s *reportService) GetReportsByComplainingUserId(complainingUserId int) ([]dto.ReportDto, error) {
	reports, err := report.ReportClient.GetReportsByComplainingUserId(complainingUserId)
	if err != nil {
		return nil, err
	}

	var reportsDto []dto.ReportDto
	for _, r := range reports {
		reportsDto = append(reportsDto, dto.ReportDto{
			ReportId:          r.ReportId,
			UserId:            r.UserId,
			PostId:            r.PostId,
			ComplainingUserId: r.ComplainingUserId,
			Reason:            r.Reason,
			Comment:           r.Comment,
			AdminComment:      r.AdminComment,
			ReportStatus:      r.ReportStatus,
			Date:              r.Date,
		})
	}
	return reportsDto, nil
}

func (s *reportService) UpdateReport(updateDto dto.ReportDto) (dto.ReportDto, error) {
	reportModel := model.Report{
		ReportId:     updateDto.ReportId, 
		AdminComment: updateDto.AdminComment,
		ReportStatus: updateDto.ReportStatus,
	}

	updated, err := report.ReportClient.UpdateReport(reportModel)
	if err != nil {
		return dto.ReportDto{}, err
	}

	return dto.ReportDto{
		ReportId:          updated.ReportId,
		UserId:            updated.UserId,
		PostId:            updated.PostId,          
		ComplainingUserId: updated.ComplainingUserId,
		Reason:            updated.Reason,
		Comment:           updated.Comment,         
		AdminComment:      updated.AdminComment,
		ReportStatus:      updated.ReportStatus,
		Date:              updated.Date,             
	}, nil
}

func (s *reportService) DeleteReport(reportId int) error {
	rep := report.ReportClient.GetReportById(reportId)
	if rep.ReportId == 0 {
		return errors.New("reporte no encontrado")
	}
	return report.ReportClient.DeleteReport(rep)
}
