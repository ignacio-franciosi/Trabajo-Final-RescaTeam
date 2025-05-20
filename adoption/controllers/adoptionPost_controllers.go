package controllers

import (
	"adoption/dto"
	"adoption/services"
	authhelper "adoption/utils/auth"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	log "github.com/sirupsen/logrus"
)

func InsertAdoptionPost(c *gin.Context) {
	authorized, userId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	// (Si más adelante querés usar isAdmin, ya lo tenés como bool)
	fmt.Println("isAdmin:", isAdmin)

	var adoptionPostDto dto.AdoptionPostDto
	if err := c.BindJSON(&adoptionPostDto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Datos inválidos"})
		return
	}

	// Asociar el userId del token a la publicación
	adoptionPostDto.UserId = userId

	adoptionPostDto, err := services.AdoptionService.InsertAdoptionPost(adoptionPostDto)
	if err != nil {
		c.JSON(err.Status(), err)
		return
	}
	c.JSON(http.StatusCreated, adoptionPostDto)
}

func GetAdoptionPostById(c *gin.Context) {
	log.Debug("Adoption post id: " + c.Param("id"))

	idParam := c.Param("id")
	id, convErr := strconv.Atoi(idParam)
	if convErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de ID inválido"})
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
	authorized, userId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	idParam := c.Param("id")
	id, convErr := strconv.Atoi(idParam)
	if convErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de ID inválido"})
		return
	}

	adoptionPostDto, apiErr := services.AdoptionService.GetAdoptionPostById(id)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	if !isAdmin && adoptionPostDto.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para eliminar esta publicación"})
		return
	}

	// Acá err es un error estándar de Go
	err := services.AdoptionService.DeleteAdoptionPost(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error interno al eliminar la publicación"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Publicación eliminada"})
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
	authorized, userId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

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

	// Obtener la publicación actual para verificar si es dueño o admin
	currentPost, apiErr := services.AdoptionService.GetAdoptionPostById(id)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	if !isAdmin && currentPost.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para editar esta publicación"})
		return
	}

	postDto, err = services.AdoptionService.UpdateAdoptionPost(postDto)
	if err != nil {
		log.Error("update failed: ", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, postDto)
}

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

func MarkAdoptionPostAsAdopted(c *gin.Context) {
	authorized, tokenUserId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	userIdParam := c.Query("userId")
	userId, err := strconv.Atoi(userIdParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Id de publicación inválido"})
		return
	}

	post, apiErr := services.AdoptionService.GetAdoptionPostById(id)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	if !isAdmin && post.UserId != tokenUserId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para marcar como adoptado"})
		return
	}

	err = services.AdoptionService.MarkAdoptionPostAsAdopted(id, userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Mascota marcada como adoptada exitosamente"})
}

func GetAllAdoptionPostsByUserId(c *gin.Context) {
	authorized, tokenUserId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	userIdParam := c.Param("userId")
	userId, err := strconv.Atoi(userIdParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId inválido"})
		return
	}

	if !isAdmin && tokenUserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para ver estas publicaciones"})
		return
	}

	postsDto, err := services.AdoptionService.GetAllAdoptionPostsByUserId(userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al obtener publicaciones"})
		return
	}

	if len(postsDto) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "Aún no hay publicaciones."})
		return
	}

	c.JSON(http.StatusOK, postsDto)
}
