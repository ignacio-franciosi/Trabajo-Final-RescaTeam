package controllers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/ignacio-franciosi/Trabajo-Final-RescaTeam/adoption/dto"
	"github.com/ignacio-franciosi/Trabajo-Final-RescaTeam/adoption/services"
	authhelper "github.com/ignacio-franciosi/Trabajo-Final-RescaTeam/adoption/utils/auth"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

func InsertAdoptionPost(c *gin.Context) {
	authorized, userId, _ := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	var adoptionPostDto dto.AdoptionPostDto
	adoptionPostDto.UserId = userId
	adoptionPostDto.Name = c.PostForm("name")
	adoptionPostDto.Species = c.PostForm("species")
	adoptionPostDto.Breed = c.PostForm("breed")
	adoptionPostDto.Color = c.PostForm("color")
	adoptionPostDto.Size = c.PostForm("size")
	adoptionPostDto.Sex = c.PostForm("sex")
	adoptionPostDto.Description = c.PostForm("description")
	adoptionPostDto.Zone = c.PostForm("zone")
	adoptionPostDto.Date = c.PostForm("date")

	// Conversion de age
	age, err := strconv.Atoi(c.PostForm("age"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid age"})
		return
	}
	adoptionPostDto.Age = age

	// Conversion de neutered
	neutered, err := strconv.ParseBool(c.PostForm("neutered"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid neutered value"})
		return
	}
	adoptionPostDto.Neutered = neutered

	// Conversion de completeVaccines
	completeVaccines, err := strconv.ParseBool(c.PostForm("complete_vaccines"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid complete_vaccines value"})
		return
	}
	adoptionPostDto.CompleteVaccines = completeVaccines

	// Conversion de adoptionStatus
	adoptionStatus := c.PostForm("adoption_status")
	if adoptionStatus != "true" && adoptionStatus != "false" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid adoption_status"})
		return
	}
	//si lo que viene es true, compara con true y guarda true. Si lo que viene es false, compara con true y guarda false
	adoptionPostDto.AdoptionStatus = adoptionStatus == "true"

	// Insertar el post
	createdPost, apiErr := services.AdoptionService.InsertAdoptionPost(adoptionPostDto)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	// Procesar imágenes
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not parse multipart form"})
		return
	}

	files := form.File["images"]
	for _, file := range files {
		uniqueID := uuid.New().String()
		ext := filepath.Ext(file.Filename)
		filename := fmt.Sprintf("%d_%s%s", createdPost.AdoptionPostId, uniqueID, ext)
		savePath := filepath.Join("images", "adoption_posts", filename)

		if err := c.SaveUploadedFile(file, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save image"})
			return
		}

		_, apiErr := services.AdoptionService.UploadImage(createdPost.AdoptionPostId, filename)
		if apiErr != nil {
			c.JSON(apiErr.Status(), apiErr)
			return
		}
	}

	c.JSON(http.StatusCreated, createdPost)
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

	post, apiErr := services.AdoptionService.GetAdoptionPostById(id)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	if !isAdmin && post.UserId != tokenUserId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para marcar como adoptado"})
		return
	}

	err = services.AdoptionService.MarkAdoptionPostAsAdopted(id, tokenUserId)
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

func UploadAdoptionImage(c *gin.Context) {
	//Verifico token y extraigo userId/isAdmin
	authorized, tokenUserId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, false)
	if !authorized {
		return
	}

	//Parseo postId de la request
	postIdStr := c.PostForm("adoption_post_id")
	postId, err := strconv.Atoi(postIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid adoption_post_id"})
		return
	}

	//Traigo el adoption post
	postDto, apiErr := services.AdoptionService.GetAdoptionPostById(postId)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	//Hago que solo el dueño o admin puede subir imágenes
	if !isAdmin && postDto.UserId != tokenUserId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para subir imagen a este post"})
		return
	}

	//Recibo del archivo
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image not provided"})
		return
	}

	//Generar nombre aleatorio y guardo la img localmente
	uniqueID := uuid.New().String()
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("%d_%s%s", postId, uniqueID, ext)
	savePath := filepath.Join("images", "adoption_posts", filename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not save image"})
		return
	}

	//Guardo el path/url en BD
	imageDto, apiErr := services.AdoptionService.UploadImage(postId, filename)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	c.JSON(http.StatusOK, imageDto)
}

func GetImagesByAdoptionPostId(c *gin.Context) {
	postIdStr := c.Param("id")
	postId, err := strconv.Atoi(postIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalido adoption_post_id"})
		return
	}

	images, apiErr := services.AdoptionService.GetImagesByAdoptionPostId(postId)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	c.JSON(http.StatusOK, images)
}

func DeleteImageById(c *gin.Context) {
	// Verifica token
	authorized, userId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	// Convierte el parámetro idImage
	idParam := c.Param("idImage")
	id, convErr := strconv.Atoi(idParam)
	if convErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de ID inválido"})
		return
	}

	// Obtiene la imagen
	imageDto, apiErr := services.AdoptionService.GetImageById(id)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	// Obtiene el adoption post al que pertenece la imagen
	adoptionPostDto, apiErr := services.AdoptionService.GetAdoptionPostById(imageDto.AdoptionPostId)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	// Verifica si el usuario es dueño del post o admin
	if !isAdmin && adoptionPostDto.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para eliminar esta imagen"})
		return
	}

	// Llama al service para eliminar
	err := services.AdoptionService.DeleteImageById(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar la imagen"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Imagen eliminada exitosamente"})
}

func DeleteAllImagesByAdoptionPostId(c *gin.Context) {
	authorized, userId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}
	// Convierte el parámetro postId
	postIdParam := c.Param("idAdPost")
	postId, err := strconv.Atoi(postIdParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de ID inválido"})
		return
	}

	// Obtiene el adoption post
	adoptionPostDto, apiErr := services.AdoptionService.GetAdoptionPostById(postId)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	// Verifica si el usuario es dueño del post o admin
	if !isAdmin && adoptionPostDto.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para eliminar las imágenes de este post"})
		return
	}

	// Llama al service
	err = services.AdoptionService.DeleteAllImagesByAdoptionPostId(postId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar las imágenes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Todas las imágenes eliminadas exitosamente"})
}
