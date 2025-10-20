package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"mime/multipart"
	"path/filepath"
	postsClient "posts/clients"
	"posts/dto"
	"posts/model"
	e "posts/utils/errors"
	"posts/utils/queue"
	s3client "posts/utils/s3"
	"strings"
)

type postsService struct{}

type postsServiceInterface interface {
	InsertPost(PostDto dto.PostDto) (dto.PostDto, e.ApiError)
	GetPostById(id string) (dto.PostDto, e.ApiError)
	DeletePost(id string) error
	GetAllPosts(postType string) (dto.PostsDto, error)
	UpdatePost(postDto dto.PostDto) (dto.PostDto, error)
	GetFilteredPosts(filters map[string]string) ([]dto.PostDto, e.ApiError)
	MarkPostAsResolved(id string) error
	GetAllPostsByUserId(userId int) ([]dto.PostDto, error)
	UploadImage(postId string, userId int, file multipart.File, filename string) (dto.ImageDto, e.ApiError)
	GetImagesByPostId(postId string) ([]dto.ImageDto, e.ApiError)
	GetImageById(id string) (dto.ImageDto, e.ApiError)
	DeleteImageById(imageId string) error
	DeleteAllImagesByPostId(postId string) error
	DeleteAllPostsByUserId(userId int) error
	DeleteAllImagesByUserId(userId int) error
	GetAllImagesByUserId(userId int) ([]dto.ImageDto, e.ApiError)
}

var (
	PostsService postsServiceInterface
)

func init() {
	PostsService = &postsService{}
}

func (s *postsService) InsertPost(postDto dto.PostDto) (dto.PostDto, e.ApiError) {
	if postDto.UserId == 0 {
		return dto.PostDto{}, e.NewBadRequestApiError("user not found")
	}

	var post model.Post
	post.UserId = postDto.UserId
	post.PostType = postDto.PostType
	post.Name = postDto.Name
	post.Species = postDto.Species
	post.Age = postDto.Age
	post.Breed = postDto.Breed
	post.Color = postDto.Color
	post.Size = postDto.Size
	post.Sex = postDto.Sex
	post.Description = postDto.Description
	post.Neutered = postDto.Neutered
	post.CompleteVaccines = postDto.CompleteVaccines
	post.PostStatus = postDto.PostStatus
	post.Date = postDto.Date
	post.Zone = postDto.Zone
	post.HealthStatus = postDto.HealthStatus
	post.Collar = postDto.Collar
	post.CollarColor = postDto.CollarColor

	insertedPost := postsClient.PostClient.InsertPost(post)

	var response dto.PostDto
	response.PostId = insertedPost.PostId.Hex()
	response.UserId = insertedPost.UserId
	response.PostType = insertedPost.PostType
	response.Name = insertedPost.Name
	response.Species = insertedPost.Species
	response.Age = insertedPost.Age
	response.Breed = insertedPost.Breed
	response.Color = insertedPost.Color
	response.Size = insertedPost.Size
	response.Sex = insertedPost.Sex
	response.Description = insertedPost.Description
	response.Neutered = insertedPost.Neutered
	response.CompleteVaccines = insertedPost.CompleteVaccines
	response.PostStatus = insertedPost.PostStatus
	response.Date = insertedPost.Date
	response.Zone = insertedPost.Zone
	response.HealthStatus = insertedPost.HealthStatus
	response.Collar = insertedPost.Collar
	response.CollarColor = insertedPost.CollarColor

	return response, nil
}

func (s *postsService) GetPostById(id string) (dto.PostDto, e.ApiError) {
	// Buscar en Mongo
	post, err := postsClient.PostClient.GetPostById(id)
	if err != nil {
		return dto.PostDto{}, e.NewNotFoundApiError("Post not found")
	}

	var postDto dto.PostDto
	postDto.PostId = post.PostId.Hex()
	postDto.UserId = post.UserId
	postDto.PostType = post.PostType
	postDto.Name = post.Name
	postDto.Species = post.Species
	postDto.Age = post.Age
	postDto.Breed = post.Breed
	postDto.Color = post.Color
	postDto.Size = post.Size
	postDto.Sex = post.Sex
	postDto.Description = post.Description
	postDto.Neutered = post.Neutered
	postDto.CompleteVaccines = post.CompleteVaccines
	postDto.PostStatus = post.PostStatus
	postDto.Date = post.Date
	postDto.Zone = post.Zone
	postDto.HealthStatus = post.HealthStatus
	postDto.Collar = post.Collar
	postDto.CollarColor = post.CollarColor

	return postDto, nil
}

func (s *postsService) DeletePost(id string) error {
	post, err := postsClient.PostClient.GetPostById(id)
	if err != nil {
		return errors.New("post not found")
	}

	// Delete the post using the model object
	err = postsClient.PostClient.DeletePost(post)
	return err
}

func (s *postsService) GetAllPosts(postType string) (dto.PostsDto, error) {
	posts := postsClient.PostClient.GetAllPosts(postType)
	var postsDto dto.PostsDto

	for _, post := range posts {
		postDto := dto.PostDto{
			PostId:           post.PostId.Hex(), // Convert ObjectID to string
			UserId:           post.UserId,
			PostType:         post.PostType,
			Name:             post.Name,
			Species:          post.Species,
			Age:              post.Age,
			Breed:            post.Breed,
			Color:            post.Color,
			Size:             post.Size,
			Sex:              post.Sex,
			Description:      post.Description,
			Neutered:         post.Neutered,
			CompleteVaccines: post.CompleteVaccines,
			PostStatus:       post.PostStatus,
			Date:             post.Date,
			Zone:             post.Zone,
			HealthStatus:     post.HealthStatus,
			Collar:           post.Collar,
			CollarColor:      post.CollarColor,
		}
		postsDto = append(postsDto, postDto)
	}

	return postsDto, nil
}

func (s *postsService) UpdatePost(postDto dto.PostDto) (dto.PostDto, error) {
	// Obtener el post actual desde la base de datos
	existingPost, err := postsClient.PostClient.GetPostById(postDto.PostId)
	if err != nil {
		return postDto, errors.New("post not found")
	}

	// Actualizar los campos
	existingPost.Name = postDto.Name
	existingPost.Species = postDto.Species
	existingPost.Age = postDto.Age
	existingPost.Breed = postDto.Breed
	existingPost.Color = postDto.Color
	existingPost.Size = postDto.Size
	existingPost.Sex = postDto.Sex
	existingPost.Description = postDto.Description
	existingPost.Neutered = postDto.Neutered
	existingPost.CompleteVaccines = postDto.CompleteVaccines
	existingPost.PostStatus = postDto.PostStatus
	existingPost.Date = postDto.Date
	existingPost.Zone = postDto.Zone
	existingPost.HealthStatus = postDto.HealthStatus
	existingPost.Collar = postDto.Collar
	existingPost.CollarColor = postDto.CollarColor

	// Actualizar en la base de datos
	updatedPost, err := postsClient.PostClient.UpdatePostById(postDto.PostId, existingPost)
	if err != nil {
		return postDto, errors.New("error updating adoption post")
	}

	// Update the PostId in response DTO
	postDto.PostId = updatedPost.PostId.Hex()
	postDto.UserId = existingPost.UserId

	return postDto, nil
}

func (s *postsService) GetFilteredPosts(filters map[string]string) ([]dto.PostDto, e.ApiError) {
	posts, err := postsClient.PostClient.GetFilteredPosts(filters)
	if err != nil {
		return nil, e.NewNotFoundApiError(err.Error())
	}

	var postDtos []dto.PostDto
	for _, p := range posts {
		postDtos = append(postDtos, dto.PostDto{
			PostId:           p.PostId.Hex(), // Convert ObjectID to string
			UserId:           p.UserId,
			PostType:         p.PostType,
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
			PostStatus:       p.PostStatus,
			Date:             p.Date,
			Zone:             p.Zone,
			HealthStatus:     p.HealthStatus,
			Collar:           p.Collar,
			CollarColor:      p.CollarColor,
		})
	}

	return postDtos, nil
}

func (s *postsService) MarkPostAsResolved(id string) error {
	_, err := postsClient.PostClient.GetPostById(id)
	if err != nil {
		return errors.New("publicación no encontrada")
	}

	err = postsClient.PostClient.MarkPostAsResolved(id)
	if err != nil {
		return errors.New("no se pudo marcar como resuelta")
	}

	return nil
}

func (s *postsService) GetAllPostsByUserId(userId int) ([]dto.PostDto, error) {
	posts, err := postsClient.PostClient.GetAllPostsByUserId(userId)
	if err != nil {
		return nil, err
	}

	var postsDto []dto.PostDto

	for _, post := range posts {
		postDto := dto.PostDto{
			PostId:           post.PostId.Hex(), // Convert ObjectID to string
			UserId:           post.UserId,
			PostType:         post.PostType, // "adoption" | "lost" | "found"
			Name:             post.Name,
			Species:          post.Species,
			Age:              post.Age,
			Breed:            post.Breed,
			Color:            post.Color,
			Size:             post.Size,
			Sex:              post.Sex,
			Description:      post.Description,
			Neutered:         post.Neutered,
			CompleteVaccines: post.CompleteVaccines,
			PostStatus:       post.PostStatus,
			Date:             post.Date,
			Zone:             post.Zone,
			HealthStatus:     post.HealthStatus,
			Collar:           post.Collar,
			CollarColor:      post.CollarColor,
		}

		postsDto = append(postsDto, postDto)
	}

	return postsDto, nil
}

func (s postsService) UploadImage(postId string, userId int, file multipart.File, filename string) (dto.ImageDto, e.ApiError) {
	// Determinar el tipo de contenido basado en la extensión
	ext := strings.ToLower(filepath.Ext(filename))
	var contentType string
	switch ext {
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".png":
		contentType = "image/png"
	case ".webp":
		contentType = "image/webp"
	default:
		contentType = "application/octet-stream"
	}

	// Subir archivo a S3
	fileURL, err := s3client.S3ClientInstance.UploadFile(file, filename, contentType)
	if err != nil {
		return dto.ImageDto{}, e.NewInternalServerApiError("Cannot upload image to S3", err)
	}

	// Guardar en base de datos - AHORA INCLUYE userId
	image := model.Image{
		PostId:   postId,  // Keep as string if that's what the model expects
		UserId:   userId,  // NUEVO: agregar userId al modelo
		Filepath: fileURL, // guardamos la URL completa de S3
	}

	savedImage, dbErr := postsClient.PostClient.UploadImage(image)
	if dbErr != nil {
		// Si falla la BD, intentar eliminar el archivo de S3
		s3client.S3ClientInstance.DeleteFile(fileURL)
		return dto.ImageDto{}, e.NewInternalServerApiError("Cannot save image to database", dbErr)
	}

	// Check if this is the first image of a lost or found post and send to search queue
	go s.sendToSearchQueueIfNeeded(postId, fileURL)

	return dto.ImageDto{
		ImageId:  savedImage.ImageId.Hex(), // Convert ObjectID to string
		PostId:   savedImage.PostId,
		UserId:   savedImage.UserId, // NUEVO: incluir userId en la respuesta
		Filepath: savedImage.Filepath,
	}, nil
}

func (s postsService) GetImagesByPostId(postId string) ([]dto.ImageDto, e.ApiError) {
	images, err := postsClient.PostClient.GetImagesByPostId(postId)
	if err != nil {
		return nil, e.NewInternalServerApiError("No se pudieron obtener imagenes", err)
	}

	var dtos []dto.ImageDto
	for _, img := range images {
		dtos = append(dtos, dto.ImageDto{
			ImageId:  img.ImageId.Hex(), // Convert ObjectID to string
			PostId:   img.PostId,
			UserId:   img.UserId,   // NUEVO: incluir userId en la respuesta
			Filepath: img.Filepath, // Ya contiene la URL completa de S3
		})
	}
	return dtos, nil
}

func (s *postsService) GetImageById(id string) (dto.ImageDto, e.ApiError) {
	image, err := postsClient.PostClient.GetImageById(id)
	if err != nil {
		return dto.ImageDto{}, e.NewBadRequestApiError("Image not found")
	}

	imageDto := dto.ImageDto{
		ImageId:  image.ImageId.Hex(),
		PostId:   image.PostId,
		UserId:   image.UserId,
		Filepath: image.Filepath,
	}

	return imageDto, nil
}

func (s *postsService) DeleteImageById(imageId string) error {
	// Obtener imagen desde BD
	image, err := postsClient.PostClient.GetImageById(imageId)
	if err != nil {
		return errors.New("imagen no encontrada")
	}

	// Eliminar archivo de S3
	if err := s3client.S3ClientInstance.DeleteFile(image.Filepath); err != nil {
		return fmt.Errorf("error al eliminar archivo de S3: %v", err)
	}

	// Eliminar desde la BD
	return postsClient.PostClient.DeleteImageById(imageId)
}

func (s *postsService) DeleteAllImagesByPostId(postId string) error {
	// Obtener todas las imágenes asociadas al post
	images, err := postsClient.PostClient.GetImagesByPostId(postId)
	if err != nil {
		return fmt.Errorf("error al obtener imágenes: %v", err)
	}

	if len(images) == 0 {
		return nil
	}

	// Iterar y eliminar archivos de S3 uno por uno
	for _, img := range images {
		if err := s3client.S3ClientInstance.DeleteFile(img.Filepath); err != nil {
			return fmt.Errorf("error al eliminar archivo de S3 %s: %v", img.Filepath, err)
		}
	}

	// Eliminar los registros de la base de datos
	if err := postsClient.PostClient.DeleteAllImagesByPostId(postId); err != nil {
		return fmt.Errorf("error al eliminar imágenes en la base de datos: %v", err)
	}

	return nil
}

func (s *postsService) DeleteAllPostsByUserId(userId int) error {
	err := postsClient.PostClient.DeleteAllPostsByUserId(userId)
	if err != nil {
		return fmt.Errorf("error al eliminar posts del usuario %d: %w", userId, err)
	}
	return nil
}

func (s *postsService) DeleteAllImagesByUserId(userId int) error {
	// Primero obtener todas las URLs/nombres de archivos de las imágenes del usuario
	// Asumiendo que tienes un método para obtener las imágenes antes de eliminarlas
	images, err := postsClient.PostClient.GetAllImagesByUserId(userId)
	if err != nil {
		return fmt.Errorf("error al obtener imagenes del usuario %d: %w", userId, err)
	}

	// Eliminar cada imagen de S3
	for _, image := range images {
		// Si tienes la URL completa de la imagen
		if image.Filepath != "" {
			err := s3client.S3ClientInstance.DeleteFile(image.Filepath)
			if err != nil {
				// Log del error pero continuar con las demás imágenes
				log.Printf("Error al eliminar imagen de S3: %s, error: %v", image.Filepath, err)
			}
		}
	}

	// Finalmente eliminar de la base de datos
	err = postsClient.PostClient.DeleteAllImagesByUserId(userId)
	if err != nil {
		return fmt.Errorf("error al eliminar imagenes del usuario %d: %w", userId, err)
	}

	return nil
}

func (s postsService) GetAllImagesByUserId(userId int) ([]dto.ImageDto, e.ApiError) {
	images, err := postsClient.PostClient.GetAllImagesByUserId(userId)
	if err != nil {
		return nil, e.NewInternalServerApiError("No se pudieron obtener imagenes", err)
	}

	var dtos []dto.ImageDto
	for _, img := range images {
		dtos = append(dtos, dto.ImageDto{
			ImageId:  img.ImageId.Hex(),
			PostId:   img.PostId,
			UserId:   img.UserId,
			Filepath: img.Filepath,
		})
	}
	return dtos, nil
}

func (s *postsService) sendToSearchQueueIfNeeded(postId string, imageUrl string) {
	// Get post details to check post type
	postDto, err := s.GetPostById(postId)
	if err != nil {
		log.Printf("Error getting post for queue message: %v", err)
		return
	}

	// Only send to queue if it's a lost or found post
	if postDto.PostType != "lost" && postDto.PostType != "found" {
		return
	}

	// Check if this is the first image (no existing images count check needed since we're in upload)
	// We'll send every image upload, but search service can handle duplicates or we can optimize later

	// Create message for search queue
	message := dto.PostSearchMessageDto{
		PostId:   postId,
		PostType: postDto.PostType,
		ImageUrl: imageUrl,
	}

	// Convert to JSON
	messageBytes, jsonErr := json.Marshal(message)
	if jsonErr != nil {
		log.Printf("Error marshaling search queue message: %v", jsonErr)
		return
	}

	// Send to search queue
	queueErr := queue.PublishToSearch(messageBytes)
	if queueErr != nil {
		log.Printf("Error sending message to search queue: %v", queueErr)
	}
}

// HandleQueueMessage handles messages from the users queue
func HandleQueueMessage(messageDto dto.QueueMessageDto) error {
	if messageDto.Message == "delete" {
		err := PostsService.DeleteAllPostsByUserId(messageDto.Id)
		if err != nil {
			log.Printf("Error deleting posts for user %d: %v", messageDto.Id, err)
			return err
		}
	}
	return nil
}
