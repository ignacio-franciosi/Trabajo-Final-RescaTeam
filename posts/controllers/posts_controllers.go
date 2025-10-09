package controllers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/smtp"
	"os"
	"path/filepath"
	"posts/services"
	"strconv"
	"strings"

	"posts/dto"
	authhelper "posts/utils/auth"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	log "github.com/sirupsen/logrus"
)

var smtpServer = "smtp.gmail.com"
var smtpPort = "587"

func InsertPost(c *gin.Context) {
	authorized, userId, _ := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	var postDto dto.PostDto

	postDto.UserId = userId
	postDto.PostType = c.PostForm("postType")

	//validación de post type
	if postDto.PostType != "adoption" && postDto.PostType != "lost" && postDto.PostType != "found" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post type"})
		return
	}

	// Función helper para convertir string a puntero solo si no está vacío
	stringToPtr := func(s string) *string {
		if s == "" {
			return nil
		}
		return &s
	}

	// Función helper para convertir int a puntero solo si no es 0
	intToPtr := func(i int) *int {
		if i == 0 {
			return nil
		}
		return &i
	}

	// Asignar campos opcionales usando helpers
	postDto.Name = stringToPtr(c.PostForm("name"))
	postDto.Species = stringToPtr(c.PostForm("species"))
	postDto.Breed = stringToPtr(c.PostForm("breed"))
	postDto.Color = stringToPtr(c.PostForm("color"))
	postDto.Size = stringToPtr(c.PostForm("size"))
	postDto.Sex = stringToPtr(c.PostForm("sex"))
	postDto.Description = stringToPtr(c.PostForm("description"))
	postDto.Zone = stringToPtr(c.PostForm("zone"))
	postDto.Date = stringToPtr(c.PostForm("date"))
	postDto.HealthStatus = stringToPtr(c.PostForm("healthStatus"))
	postDto.CollarColor = stringToPtr(c.PostForm("collarColor"))

	// Conversion de age
	if ageStr := c.PostForm("age"); ageStr != "" {
		age, err := strconv.Atoi(ageStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid age"})
			return
		}
		postDto.Age = intToPtr(age)
	}

	// Conversion de neutered
	if neuteredStr := c.PostForm("neutered"); neuteredStr != "" {
		neuteredVal, err := strconv.ParseBool(neuteredStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid neutered value"})
			return
		}
		postDto.Neutered = &neuteredVal
	}

	// Conversion de collar - CORREGÍ EL BUG AQUÍ
	if collarStr := c.PostForm("collar"); collarStr != "" {
		collarVal, err := strconv.ParseBool(collarStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid collar value"})
			return
		}
		postDto.Collar = &collarVal // Era CompleteVaccines, ahora es Collar
	}

	// Conversion de completeVaccines
	if vaccinesStr := c.PostForm("completeVaccines"); vaccinesStr != "" {
		vaccinesVal, err := strconv.ParseBool(vaccinesStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid completeVaccines value"})
			return
		}
		postDto.CompleteVaccines = &vaccinesVal
	}

	// Conversion de postStatus
	postStatus := c.PostForm("postStatus")
	if postStatus != "true" && postStatus != "false" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid post_status"})
		return
	}
	postDto.PostStatus = postStatus == "true"

	// Resto del código permanece igual...
	createdPost, apiErr := services.PostsService.InsertPost(postDto)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	// Procesar imágenes - MODIFICADO PARA S3 Y userId
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not parse multipart form"})
		return
	}

	files := form.File["images"]
	for _, fileHeader := range files {
		// Abrir el archivo
		file, err := fileHeader.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not open uploaded file"})
			return
		}
		defer file.Close()

		// Generar nombre único
		uniqueID := uuid.New().String()
		ext := filepath.Ext(fileHeader.Filename)
		filename := fmt.Sprintf("%s_%s%s", createdPost.PostId, uniqueID, ext)

		// Subir a S3 - AHORA INCLUYE userId
		_, apiErr := services.PostsService.UploadImage(createdPost.PostId, userId, file, filename)
		if apiErr != nil {
			c.JSON(apiErr.Status(), apiErr)
			return
		}
	}

	c.JSON(http.StatusCreated, createdPost)
}

func GetPostById(c *gin.Context) {

	idParam := c.Param("id")

	postDto, err := services.PostsService.GetPostById(idParam)
	if err != nil {
		c.JSON(err.Status(), err)
		return
	}
	c.JSON(http.StatusOK, postDto)
}

func DeletePost(c *gin.Context) {
	authorized, userId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	id := c.Param("id")

	postDto, apiErr := services.PostsService.GetPostById(id)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	// Validamos que solo admin o dueño pueda borrar
	if !isAdmin && postDto.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para eliminar esta publicación"})
		return
	}

	// Eliminamos el post
	err := services.PostsService.DeletePost(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error interno al eliminar la publicación"})
		return
	}

	// Si la acción la realizó un admin, enviamos un mail al owner informando la eliminación
	if isAdmin {
		// obtenemos datos del usuario desde users service (forward token para autorizar)
		usersUrl := fmt.Sprintf("http://localhost:8080/user/%d", postDto.UserId)
		req, _ := http.NewRequest("GET", usersUrl, nil)
		if t := c.GetHeader("Authorization"); t != "" {
			req.Header.Set("Authorization", t)
		}
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			log.Error("Error al obtener usuario para notificación: ", err)
		} else {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				b, _ := io.ReadAll(resp.Body)
				var userObj map[string]interface{}
				if err := json.Unmarshal(b, &userObj); err == nil {
					email, _ := userObj["email"].(string)
					name, _ := userObj["name"].(string)
					if email != "" {
						// Use same SMTP defaults as users service: allow overriding MAIL_SMTP and MAIL_SMTP_PORT,
						// but default to gmail settings when not provided. Read MAIL_USER and MAIL_PASS for auth.
						// use package-level smtpServer and smtpPort (defaults set above)
						from := os.Getenv("MAIL_USER")
						pass := os.Getenv("MAIL_PASS")
						subject := "Subject: RescaTeam - Publicación eliminada\n"
						reason := "Violación de los términos de servicio"

						// Construir descripción legible de la mascota (nombre, especie, sexo) si está disponible
						var petParts []string
						if postDto.Name != nil && *postDto.Name != "" {
							petParts = append(petParts, fmt.Sprintf("Nombre: %s", *postDto.Name))
						}
						if postDto.Species != nil && *postDto.Species != "" {
							petParts = append(petParts, fmt.Sprintf("Especie: %s", *postDto.Species))
						}
						if postDto.Sex != nil && *postDto.Sex != "" {
							petParts = append(petParts, fmt.Sprintf("Sexo: %s", *postDto.Sex))
						}
						petInfo := ""
						if len(petParts) > 0 {
							petInfo = strings.Join(petParts, ", ")
						} else {
							// fallback al ID si no hay datos de la mascota
							petInfo = fmt.Sprintf("ID: %s", id)
						}

						body := fmt.Sprintf("Hola %s,\n\nTu publicación (%s) ha sido eliminada por un administrador.\nMotivo: %s\n\nSi crees que esto es un error, contactáctanos por este medio.\n\nSaludos,\nEquipo de RescaTeam", name, petInfo, reason)
						msg := []byte(subject + "\n" + body)
						auth := smtp.PlainAuth("", from, pass, smtpServer)
						if err := smtp.SendMail(smtpServer+":"+smtpPort, auth, from, []string{email}, msg); err != nil {
							log.Error("Error al enviar email de eliminación de post: ", err)
						}
					}
				}
			} else {
				log.Error("Users service respondió con status no OK al obtener usuario: ", resp.Status)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Publicación eliminada"})
}

func GetAllPosts(c *gin.Context) {
	postType := c.Query("type") // puede ser "adoption", "lost", "found" o vacío

	postsDto, err := services.PostsService.GetAllPosts(postType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, postsDto)
}

func UpdatePost(c *gin.Context) {
	authorized, userId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	id := c.Param("id")
	if id == "" {
		log.Error("invalid PostId: empty")
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid PostId"})
		return
	}

	var postDto dto.PostDto
	if err := c.BindJSON(&postDto); err != nil {
		log.Error("invalid body: ", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	postDto.PostId = id

	// Obtener la publicación actual para verificar permisos
	currentPost, apiErr := services.PostsService.GetPostById(id)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	if !isAdmin && currentPost.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para editar esta publicación"})
		return
	}

	updatedPost, err := services.PostsService.UpdatePost(postDto)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updatedPost)
}

func GetFilteredPosts(c *gin.Context) {
	filters := map[string]string{}

	// Cargar los filtros solo si están presentes
	if v := c.Query("species"); v != "" {
		filters["species"] = v
	}
	if v := c.Query("age"); v != "" {
		filters["age"] = v
	}
	if v := c.Query("postType"); v != "" {
		filters["postType"] = v
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
	if v := c.Query("completeVaccines"); v != "" {
		filters["completeVaccines"] = v
	}
	if v := c.Query("zone"); v != "" {
		filters["zone"] = v
	}
	if v := c.Query("healthStatus"); v != "" {
		filters["healthStatus"] = v
	}
	if v := c.Query("collarColor"); v != "" {
		filters["collarColor"] = v
	}
	if v := c.Query("breed"); v != "" {
		filters["breed"] = v
	}
	posts, err := services.PostsService.GetFilteredPosts(filters)
	if err != nil {
		c.JSON(err.Status(), err)
		return
	}

	if len(posts) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": "No se encontraron resultados con los filtros especificados",
			"data":    []dto.PostDto{},
		})
		return
	}

	c.JSON(http.StatusOK, posts)
}

func MarkPostAsResolved(c *gin.Context) {
	authorized, tokenUserId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID requerido"})
		return
	}

	// Traemos el post
	post, apiErr := services.PostsService.GetPostById(id)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	// Solo el dueño o admin puede marcarlo como resuelto
	if !isAdmin && post.UserId != tokenUserId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para marcar como adoptado/encontrado"})
		return
	}

	err := services.PostsService.MarkPostAsResolved(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Post marcado como resuelto exitosamente"})
}

func GetAllPostsByUserId(c *gin.Context) {
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

	postsDto, err := services.PostsService.GetAllPostsByUserId(userId)
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

func UploadImage(c *gin.Context) {
	// Verifico token y extraigo userId/isAdmin
	authorized, tokenUserId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, false)
	if !authorized {
		return
	}

	postIdStr := c.PostForm("postId")
	if postIdStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "postId is required"})
		return
	}

	postDto, apiErr := services.PostsService.GetPostById(postIdStr)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	// Solo el dueño o admin puede subir imágenes
	if !isAdmin && postDto.UserId != tokenUserId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para subir imagen a este post"})
		return
	}

	// Recibo el archivo - MODIFICADO PARA S3
	fileHeader, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image not provided"})
		return
	}

	// Abrir el archivo
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not open uploaded file"})
		return
	}
	defer file.Close()

	// Generar nombre único
	uniqueID := uuid.New().String()
	ext := filepath.Ext(fileHeader.Filename)
	filename := fmt.Sprintf("%s_%s%s", postIdStr, uniqueID, ext)

	// Subir a S3 y guardar en Mongo - AHORA INCLUYE tokenUserId
	imageDto, apiErr := services.PostsService.UploadImage(postIdStr, tokenUserId, file, filename)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	c.JSON(http.StatusOK, imageDto)
}

func GetImagesByPostId(c *gin.Context) {
	postId := c.Param("id")

	images, apiErr := services.PostsService.GetImagesByPostId(postId)
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

	// Obtiene el parámetro idImage
	imageId := c.Param("idImage")

	// Obtiene la imagen
	imageDto, apiErr := services.PostsService.GetImageById(imageId)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	// Obtiene el post al que pertenece la imagen
	postDto, apiErr := services.PostsService.GetPostById(imageDto.PostId)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	// Verifica si el usuario es dueño del post o admin
	if !isAdmin && postDto.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para eliminar esta imagen"})
		return
	}

	// Llama al service para eliminar (incluye S3 si aplica)
	err := services.PostsService.DeleteImageById(imageId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar la imagen"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Imagen eliminada exitosamente"})
}

func DeleteAllImagesByPostId(c *gin.Context) {
	// Verifica token
	authorized, userId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	postId := c.Param("postId")

	// Obtiene el post
	postDto, apiErr := services.PostsService.GetPostById(postId)
	if apiErr != nil {
		c.JSON(apiErr.Status(), apiErr)
		return
	}

	// Verifica si el usuario es dueño del post o admin
	if !isAdmin && postDto.UserId != userId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para eliminar las imágenes de este post"})
		return
	}

	// Llama al service (ahora elimina de S3 también)
	err := services.PostsService.DeleteAllImagesByPostId(postId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al eliminar las imágenes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Todas las imágenes eliminadas exitosamente"})
}

func DeleteAllPostsByUserId(c *gin.Context) {
	// Validar token y permisos
	authorized, tokenUserId, isAdmin := authhelper.VerifyTokenAndAuthorize(c, true, true)
	if !authorized {
		return
	}

	// Obtener el userId de los parámetros de la URL
	paramUserIdStr := c.Param("userId")
	paramUserId, err := strconv.Atoi(paramUserIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "userId inválido"})
		return
	}

	// Verificar permisos: el user solo puede borrar sus propios posts (o un admin cualquiera)
	if !isAdmin && tokenUserId != paramUserId {
		c.JSON(http.StatusForbidden, gin.H{"error": "No autorizado para eliminar los posts de este usuario"})
		return
	}

	// Llamar al service para eliminar tanto posts como imágenes
	if err := services.PostsService.DeleteAllPostsByUserId(paramUserId); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error al eliminar posts del usuario %d: %v", paramUserId, err)})
		return
	}
	if err := services.PostsService.DeleteAllImagesByUserId(paramUserId); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Error al eliminar imágenes del usuario %d: %v", paramUserId, err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Todos los posts del usuario %d eliminados exitosamente", paramUserId)})
}
