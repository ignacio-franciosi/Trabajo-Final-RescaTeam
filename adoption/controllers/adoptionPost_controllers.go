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
