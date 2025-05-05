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

func GetAdoptionPostById(c *gin.Context) {
	log.Debug("Adoption post id: " + c.Param("id"))

	idParam := c.Param("id")
	id, convErr := strconv.Atoi(idParam)
	if convErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

	adoptionPostDto, err := services.AdoptionService.GetAdoptionPostById(id)
	if err != nil {
		c.JSON(err.Status(), err)
		return
	}
	c.JSON(http.StatusOK, adoptionPostDto)
}

func DeleteAdoptionPost(c *gin.Context) {
	idParam := c.Param("id")
	id, convErr := strconv.Atoi(idParam)
	if convErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID format"})
		return
	}

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

/*
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
*/

func GetFilteredAdoptionPosts(c *gin.Context) {
	filters := map[string]string{}

	// Cargar los filtros solo si están presentes
	if v := c.Query("species"); v != "" {
		filters["species"] = v
	}
	if v := c.Query("age"); v != "" {
		filters["age"] = v
	}
	if v := c.Query("size"); v != "" {
		filters["size"] = v
	}
	if v := c.Query("sex"); v != "" {
		filters["sex"] = v
	}
	if v := c.Query("neutered"); v != "" {
		filters["neutered"] = v
	}
	if v := c.Query("complete_vaccines"); v != "" {
		filters["complete_vaccines"] = v
	}
	if v := c.Query("zone"); v != "" {
		filters["zone"] = v
	}

	posts, err := services.AdoptionService.GetFilteredAdoptionPosts(filters)
	if err != nil {
		c.JSON(err.Status(), err)
		return
	}

	if len(posts) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": "No se encontraron resultados con los filtros especificados",
			"data":    []dto.AdoptionPostDto{},
		})
		return
	}

	c.JSON(http.StatusOK, posts)
}
