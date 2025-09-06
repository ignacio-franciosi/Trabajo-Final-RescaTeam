package reportController

import (
	"net/http"
	"strconv"
	dto "users/dto"
	service "users/services/report"
	authhelper "users/utils/auth"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)


func InsertReport(c *gin.Context) {
	var reportDto dto.ReportDto
	if err := c.BindJSON(&reportDto); err != nil {
		log.Error(err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	if !authhelper.VerifyAuthentication(c) {
		return
	}

	userIdFromToken, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
		return
	}
	reportDto.UserId = userIdFromToken.(int)

	created, err := service.ReportService.InsertReport(reportDto)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, created)
}



func GetReportById(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	report, err := service.ReportService.GetReportById(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if !authhelper.VerifyTokenAndAuthorize(c, true, true, report.UserId) {
		return
	}

	c.JSON(http.StatusOK, report)
}


func GetAllReports(c *gin.Context) {

	if !authhelper.VerifyTokenAndAuthorize(c, true, false, -1) {
		return
	}

	reports, err := service.ReportService.GetAllReports()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}


func GetReportsByUserId(c *gin.Context) {
	userId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	if !authhelper.VerifyTokenAndAuthorize(c, true, true, userId) {
		return
	}

	reports, err := service.ReportService.GetReportsByUserId(userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}


func GetReportsByComplainingUserId(c *gin.Context) {
	complainingUserId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}


	if !authhelper.VerifyTokenAndAuthorize(c, true, false, -1) {
		return
	}

	reports, err := service.ReportService.GetReportsByComplainingUserId(complainingUserId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, reports)
}


func UpdateReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var reportDto dto.ReportDto
	if err := c.BindJSON(&reportDto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	if !authhelper.VerifyTokenAndAuthorize(c, true, false, -1) {
		return
	}

	reportDto.ReportId = id
	updated, err := service.ReportService.UpdateReport(reportDto)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updated)
}


func DeleteReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	report, err := service.ReportService.GetReportById(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	if !authhelper.VerifyTokenAndAuthorize(c, true, true, report.UserId) {
		return
	}

	err = service.ReportService.DeleteReport(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reporte eliminado con éxito"})
}