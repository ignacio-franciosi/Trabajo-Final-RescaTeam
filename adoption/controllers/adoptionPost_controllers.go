package controllers

import (
	"adoption/dto"
	"adoption/services"
	"net/http"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func InsertAdoptionPost(c *gin.Context) {

	var adoptionPostDto dto.AdoptionPostDto
	err := c.BindJSON(&adoptionPostDto)

	// Error Parsing json param
	if err != nil {
		log.Error(err.Error())
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}

	adoptionPostDto, er := services.AdoptionService.InsertAdoptionPost(adoptionPostDto)
	if er != nil {
		c.JSON(er.Status(), er)
		return
	}
	c.JSON(http.StatusCreated, adoptionPostDto)

}

func GetHotelById(c *gin.Context) {

	log.Debug("Adoption post id: " + c.Param("id"))

	id := (c.Param("id"))
	var adoptionPostDto dto.AdoptionPostDto

	adoptionPostDto, err := services.AdoptionService.GetAdoptionPostById(id)

	if err != nil {
		c.JSON(err.Status(), err)
		return
	}
	c.JSON(http.StatusOK, adoptionPostDto)
}

func DeleteAdoptionPost(c *gin.Context) {
	id := c.Param("id")

	err := services.AdoptionService.DeleteAdoptionPost(id)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Adoption post deleted"})
}
