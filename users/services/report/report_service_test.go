package report_test

import (
	"errors"
	"testing"
	clients "users/clients/report"
	"users/dto"
	"users/model"
	services "users/services/report"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// --- Mock que implementa la interfaz del client ---

type mockReportClient struct {
	mock.Mock
}

func (m *mockReportClient) InsertReport(report model.Report) model.Report {
	args := m.Called(report)
	return args.Get(0).(model.Report)
}

func (m *mockReportClient) GetReportById(reportId int) model.Report {
	args := m.Called(reportId)
	return args.Get(0).(model.Report)
}

func (m *mockReportClient) GetAllReports() (model.Reports, error) {
	args := m.Called()
	return args.Get(0).(model.Reports), args.Error(1)
}

func (m *mockReportClient) GetReportsByUserId(userId int) (model.Reports, error) {
	args := m.Called(userId)
	return args.Get(0).(model.Reports), args.Error(1)
}

func (m *mockReportClient) GetReportsByComplainingUserId(complainingUserId int) (model.Reports, error) {
	args := m.Called(complainingUserId)
	return args.Get(0).(model.Reports), args.Error(1)
}

func (m *mockReportClient) GetAllReportsByStatus(status string) (model.Reports, error) {
	args := m.Called(status)
	return args.Get(0).(model.Reports), args.Error(1)
}

func (m *mockReportClient) UpdateReport(report model.Report) (model.Report, error) {
	args := m.Called(report)
	return args.Get(0).(model.Report), args.Error(1)
}

func (m *mockReportClient) DeleteReport(report model.Report) error {
	args := m.Called(report)
	return args.Error(0)
}

// --- TESTS ---

// TESTS InsertReport
func TestInsertReport_Success(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	inputDto := dto.ReportDto{
		UserId:            1,
		PostId:            "post123",
		ComplainingUserId: 2,
		Reason:            "Spam",
		Comment:           "Este post es spam",
	}

	createdReport := model.Report{
		ReportId:          1,
		UserId:            1,
		PostId:            "post123",
		ComplainingUserId: 2,
		Reason:            "Spam",
		Comment:           "Este post es spam",
		ReportStatus:      "pending",
		AdminComment:      nil,
	}

	mockClient.On("InsertReport", mock.AnythingOfType("model.Report")).Return(createdReport)

	result, err := services.ReportService.InsertReport(inputDto)

	assert.Nil(t, err)
	assert.Equal(t, 1, result.ReportId)
	assert.Equal(t, "pending", result.ReportStatus)
	assert.Equal(t, inputDto.UserId, result.UserId)
	assert.Equal(t, inputDto.PostId, result.PostId)
	mockClient.AssertExpectations(t)
}

func TestInsertReport_Error_CreationFailed(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	inputDto := dto.ReportDto{
		UserId:            1,
		PostId:            "post123",
		ComplainingUserId: 2,
		Reason:            "Spam",
		Comment:           "Este post es spam",
	}

	// Retornar un reporte con ReportId = 0 indica fallo en la creación
	mockClient.On("InsertReport", mock.AnythingOfType("model.Report")).Return(model.Report{})

	result, err := services.ReportService.InsertReport(inputDto)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "no se pudo crear el reporte")
	assert.Equal(t, 0, result.ReportId)
	mockClient.AssertExpectations(t)
}

// TESTS GetReportById
func TestGetReportById_Success(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	expectedReport := model.Report{
		ReportId:          1,
		UserId:            5,
		PostId:            "post456",
		ComplainingUserId: 3,
		Reason:            "Contenido inapropiado",
		Comment:           "El contenido es ofensivo",
		ReportStatus:      "pending",
		Date:              "2024-01-15T10:30:00Z",
		AdminComment:      nil,
	}

	mockClient.On("GetReportById", 1).Return(expectedReport)

	result, err := services.ReportService.GetReportById(1)

	assert.Nil(t, err)
	assert.Equal(t, expectedReport.ReportId, result.ReportId)
	assert.Equal(t, expectedReport.UserId, result.UserId)
	assert.Equal(t, expectedReport.PostId, result.PostId)
	assert.Equal(t, expectedReport.ReportStatus, result.ReportStatus)
	mockClient.AssertExpectations(t)
}

func TestGetReportById_Error_NotFound(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	mockClient.On("GetReportById", 999).Return(model.Report{})

	result, err := services.ReportService.GetReportById(999)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "reporte no encontrado")
	assert.Equal(t, 0, result.ReportId)
	mockClient.AssertExpectations(t)
}

// TESTS GetAllReports
func TestGetAllReports_Success(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	reports := model.Reports{
		{
			ReportId:          1,
			UserId:            1,
			PostId:            "post1",
			ComplainingUserId: 2,
			Reason:            "Spam",
			Comment:           "Comentario 1",
			ReportStatus:      "pending",
			Date:              "2024-01-15T10:30:00Z",
		},
		{
			ReportId:          2,
			UserId:            3,
			PostId:            "post2",
			ComplainingUserId: 4,
			Reason:            "Contenido inapropiado",
			Comment:           "Comentario 2",
			ReportStatus:      "resolved",
			Date:              "2024-01-16T11:00:00Z",
		},
	}

	mockClient.On("GetAllReports").Return(reports, nil)

	result, err := services.ReportService.GetAllReports()

	assert.Nil(t, err)
	assert.Equal(t, 2, len(result))
	assert.Equal(t, 1, result[0].ReportId)
	assert.Equal(t, 2, result[1].ReportId)
	mockClient.AssertExpectations(t)
}

func TestGetAllReports_Error(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	mockClient.On("GetAllReports").Return(model.Reports{}, errors.New("database error"))

	result, err := services.ReportService.GetAllReports()

	assert.NotNil(t, err)
	assert.EqualError(t, err, "database error")
	assert.Nil(t, result)
	mockClient.AssertExpectations(t)
}

// TESTS GetReportsByUserId
func TestGetReportsByUserId_Success(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	reports := model.Reports{
		{
			ReportId:          1,
			UserId:            5,
			PostId:            "post1",
			ComplainingUserId: 2,
			Reason:            "Spam",
			Comment:           "Comentario 1",
			ReportStatus:      "pending",
			Date:              "2024-01-15T10:30:00Z",
		},
		{
			ReportId:          2,
			UserId:            5,
			PostId:            "post2",
			ComplainingUserId: 3,
			Reason:            "Contenido inapropiado",
			Comment:           "Comentario 2",
			ReportStatus:      "resolved",
			Date:              "2024-01-16T11:00:00Z",
		},
	}

	mockClient.On("GetReportsByUserId", 5).Return(reports, nil)

	result, err := services.ReportService.GetReportsByUserId(5)

	assert.Nil(t, err)
	assert.Equal(t, 2, len(result))
	assert.Equal(t, 5, result[0].UserId)
	assert.Equal(t, 5, result[1].UserId)
	mockClient.AssertExpectations(t)
}

func TestGetReportsByUserId_Error(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	mockClient.On("GetReportsByUserId", 999).Return(model.Reports{}, errors.New("database error"))

	result, err := services.ReportService.GetReportsByUserId(999)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "database error")
	assert.Nil(t, result)
	mockClient.AssertExpectations(t)
}

func TestGetReportsByUserId_EmptyResult(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	mockClient.On("GetReportsByUserId", 10).Return(model.Reports{}, nil)

	result, err := services.ReportService.GetReportsByUserId(10)

	assert.Nil(t, err)
	assert.Equal(t, 0, len(result))
	mockClient.AssertExpectations(t)
}

// TESTS GetReportsByComplainingUserId
func TestGetReportsByComplainingUserId_Success(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	reports := model.Reports{
		{
			ReportId:          1,
			UserId:            5,
			PostId:            "post1",
			ComplainingUserId: 7,
			Reason:            "Spam",
			Comment:           "Comentario 1",
			ReportStatus:      "pending",
			Date:              "2024-01-15T10:30:00Z",
		},
	}

	mockClient.On("GetReportsByComplainingUserId", 7).Return(reports, nil)

	result, err := services.ReportService.GetReportsByComplainingUserId(7)

	assert.Nil(t, err)
	assert.Equal(t, 1, len(result))
	assert.Equal(t, 7, result[0].ComplainingUserId)
	mockClient.AssertExpectations(t)
}

func TestGetReportsByComplainingUserId_Error(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	mockClient.On("GetReportsByComplainingUserId", 999).Return(model.Reports{}, errors.New("database error"))

	result, err := services.ReportService.GetReportsByComplainingUserId(999)

	assert.NotNil(t, err)
	assert.EqualError(t, err, "database error")
	assert.Nil(t, result)
	mockClient.AssertExpectations(t)
}

// TESTS GetAllReportsByStatus
func TestGetAllReportsByStatus_Success(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	reports := model.Reports{
		{
			ReportId:          1,
			UserId:            1,
			PostId:            "post1",
			ComplainingUserId: 2,
			Reason:            "Spam",
			Comment:           "Comentario 1",
			ReportStatus:      "pending",
			Date:              "2024-01-15T10:30:00Z",
		},
		{
			ReportId:          3,
			UserId:            3,
			PostId:            "post3",
			ComplainingUserId: 4,
			Reason:            "Contenido inapropiado",
			Comment:           "Comentario 3",
			ReportStatus:      "pending",
			Date:              "2024-01-17T12:00:00Z",
		},
	}

	mockClient.On("GetAllReportsByStatus", "pending").Return(reports, nil)

	result, err := services.ReportService.GetAllReportsByStatus("pending")

	assert.Nil(t, err)
	assert.Equal(t, 2, len(result))
	assert.Equal(t, "pending", result[0].ReportStatus)
	assert.Equal(t, "pending", result[1].ReportStatus)
	mockClient.AssertExpectations(t)
}

func TestGetAllReportsByStatus_Error(t *testing.T) {
	mockClient := new(mockReportClient)
	clients.ReportClient = mockClient

	mockClient.On("GetAllReportsByStatus", "resolved").Return(model.Reports{}, errors.New("database error"))

	result, err := services.ReportService.GetAllReportsByStatus("resolved")

	assert.NotNil(t, err)
	assert.EqualError(t, err, "database error")
	assert.Nil(t, result)
	mockClient.AssertExpectations(t)
}
