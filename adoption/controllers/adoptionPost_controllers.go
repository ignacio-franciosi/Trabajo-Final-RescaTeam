package controllers

import (
	"adoption/dto"
	"adoption/services"
	"net/http"
	"strconv"

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

func GetAllAdoptionPosts(c *gin.Context) {
	postsDto, err := services.AdoptionService.GetAllAdoptionPosts()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, postsDto)
}

func UpdateAdoptionPost(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		log.Error("invalid adoptionPostId: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid adoptionPostId"})
		return
	}

	var postDto dto.AdoptionPostDto
	if err := c.BindJSON(&postDto); err != nil {
		log.Error("invalid body: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	postDto.AdoptionPostId = id

	postDto, err = services.AdoptionService.UpdateAdoptionPost(postDto)
	if err != nil {
		log.Error("update failed: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, postDto)
}
