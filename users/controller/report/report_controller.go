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

	// Verificar que el usuario esté autenticado (cualquier usuario puede crear reportes)
	if !authhelper.VerifyAuthentication(c) {
		return
	}

	// Ahora sí podemos obtener el userId del contexto
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


// ✅ GetReportById - Admin y user owner (NO CAMBIOS - está correcto)
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

// ❌ GetAllReports - Solo admin (CAMBIO NECESARIO)
func GetAllReports(c *gin.Context) {
	// Cambiar: allowOwner debe ser false, y reqUserId debe ser un valor que nunca coincida
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

// ✅ GetReportsByUserId - Owner y admin (NO CAMBIOS - está correcto)
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

// ❌ GetReportsByComplainingUserId - Solo admin (CAMBIO NECESARIO)
func GetReportsByComplainingUserId(c *gin.Context) {
	complainingUserId, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Cambiar: reqUserId debe ser un valor que nunca coincida
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

// ❌ UpdateReport - Solo admin (CAMBIO NECESARIO)
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

	// Cambiar: Solo admin puede actualizar, reqUserId debe ser un valor que nunca coincida
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

// ✅ DeleteReport - Admin o dueño (NO CAMBIOS - está correcto)
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