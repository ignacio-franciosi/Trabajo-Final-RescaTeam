package controllers

import (
	"net/http"
	"posts/dto"
	"posts/services"
	//authhelper "posts/utils/auth"

	"github.com/gin-gonic/gin"
)

// AnalyzeImageHandler: acepta multipart/form-data con un archivo.
// Claves aceptadas: "image" (preferida) o "file" (alias).
// Retorna un PostAutocompleteDto con campos sugeridos.
func AnalyzeImageHandler(c *gin.Context) {
	/*
	// Require authenticated user or admin
	authorized, _, _ := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}
	*/
	// Try 'image' then 'file'
	fileHeader, err := c.FormFile("image")
	if err != nil {
		fileHeader, err = c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "image file is required (form-data key 'image' or 'file')"})
			return
		}
	}
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot open uploaded file"})
		return
	}
	defer file.Close()

	result, err := services.AutocompleteService.AnalyzeImage(file, fileHeader.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, toAutocompleteDto(result))
}

// toAutocompleteDto filters out internal fields and returns only the desired subset
func toAutocompleteDto(p dto.PostDto) dto.PostAutocompleteDto {
	return dto.PostAutocompleteDto{
		Name:             p.Name,
		Species:          p.Species,
		Age:              p.Age,
		Breed:            p.Breed,
		Color:            p.Color,
		Size:             p.Size,
		Sex:              p.Sex,
		Description:      p.Description,
		Neutered:         p.Neutered,
		CompleteVaccines: p.CompleteVaccines,
		Date:             p.Date,
		Zone:             p.Zone,
		HealthStatus:     p.HealthStatus,
		Collar:           p.Collar,
		CollarColor:      p.CollarColor,
	}
}
