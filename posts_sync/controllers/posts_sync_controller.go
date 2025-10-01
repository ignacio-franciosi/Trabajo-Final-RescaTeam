package controllers

import (
	"net/http"
	services "posts_sync/services"

	"github.com/gin-gonic/gin"
	_ "github.com/golang-jwt/jwt/v4"
	log "github.com/sirupsen/logrus"
)

func CreateVector(c *gin.Context) {

	var createDto dto.createDto
	err := c.BindJSON(&createDto)

	// Error Parsing json param
	if err != nil {
		log.Error(err.Error())
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}

	er := services.PostsSyncService.CreateVector(createDto)
	if er != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": er.Error()})
		return
	}

	c.JSON(http.StatusCreated)
}

func GetSimilarPets(c *gin.Context) {
	var requestDto dto.requestDto
	err := c.BindJSON(&requestDto)

	// Error Parsing json param
	if err != nil {
		log.Error(err.Error())
		c.JSON(http.StatusBadRequest, err.Error())
		return
	}

	vectorsDto, err := services.PostsSyncService.GetSimilarPets()

	if err != nil {
		if err.Error() == "some error message" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK)
}
