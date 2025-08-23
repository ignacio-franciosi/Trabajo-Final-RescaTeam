package utils

import (
	"bytes"
	"fmt"
	"mime/multipart"
	"net/http"
	"os"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

type S3Client struct {
	session    *session.Session
	uploader   *s3manager.Uploader
	downloader *s3manager.Downloader
	s3Service  *s3.S3
	bucketName string
}

var S3ClientInstance *S3Client

func InitS3Client() error {
	bucketName := os.Getenv("AWS_S3_BUCKET_NAME")
	region := os.Getenv("AWS_REGION")

	if bucketName == "" {
		return fmt.Errorf("AWS_S3_BUCKET_NAME environment variable is required")
	}

	if region == "" {
		region = "us-east-1" // región por defecto
	}

	// Crear sesión de AWS con configuración mejorada
	sess, err := session.NewSession(&aws.Config{
		Region:     aws.String(region),
		MaxRetries: aws.Int(3),
		HTTPClient: &http.Client{
			Timeout: time.Second * 60, // Aumentar timeout
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 100,
				IdleConnTimeout:     90 * time.Second,
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create AWS session: %v", err)
	}

	// Configurar uploader con reintentos y configuración personalizada
	uploader := s3manager.NewUploader(sess)
	uploader.PartSize = 5 * 1024 * 1024 // 5MB por parte
	uploader.LeavePartsOnError = false  // Limpiar partes en caso de error
	uploader.Concurrency = 1            // Reducir concurrencia para evitar problemas de red

	S3ClientInstance = &S3Client{
		session:    sess,
		uploader:   uploader,
		downloader: s3manager.NewDownloader(sess),
		s3Service:  s3.New(sess),
		bucketName: bucketName,
	}

	return nil
}

func (client *S3Client) UploadFile(file multipart.File, filename string, contentType string) (string, error) {
	// Leer el contenido del archivo completo
	file.Seek(0, 0) // Asegurar que estamos al inicio del archivo

	// Crear un buffer para todo el contenido
	var fullBuffer bytes.Buffer
	_, err := fullBuffer.ReadFrom(file)
	if err != nil {
		return "", fmt.Errorf("failed to read file content: %v", err)
	}

	// Resetear el puntero del archivo
	file.Seek(0, 0)

	// Configurar input para subida con reintentos
	uploadInput := &s3manager.UploadInput{
		Bucket:      aws.String(client.bucketName),
		Key:         aws.String("adoption-images/" + filename),
		Body:        bytes.NewReader(fullBuffer.Bytes()),
		ContentType: aws.String(contentType),
		ACL:         aws.String("public-read"),
	}

	// Subir archivo a S3 con manejo de errores mejorado
	var result *s3manager.UploadOutput
	maxRetries := 3

	for i := 0; i < maxRetries; i++ {
		// Crear nuevo reader para cada intento
		uploadInput.Body = bytes.NewReader(fullBuffer.Bytes())

		result, err = client.uploader.Upload(uploadInput)
		if err == nil {
			break // Éxito, salir del loop
		}

		// Si no es el último intento, esperar antes de reintentar
		if i < maxRetries-1 {
			time.Sleep(time.Second * time.Duration(i+1)) // Espera incremental
		}
	}

	if err != nil {
		return "", fmt.Errorf("failed to upload file to S3 after %d attempts: %v", maxRetries, err)
	}

	return result.Location, nil
}

func (client *S3Client) DeleteFile(fileURL string) error {
	// Extraer la key del archivo de la URL
	// La URL típica es: https://bucket-name.s3.region.amazonaws.com/adoption-images/filename
	// Necesitamos extraer "adoption-images/filename"

	var key string
	if len(fileURL) > 0 {
		// Buscar "adoption-images/" en la URL
		prefix := "adoption-images/"
		idx := bytes.Index([]byte(fileURL), []byte(prefix))
		if idx != -1 {
			key = fileURL[idx:]
		} else {
			return fmt.Errorf("invalid S3 URL format: %s", fileURL)
		}
	} else {
		return fmt.Errorf("empty file URL")
	}

	// Eliminar archivo de S3
	_, err := client.s3Service.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(client.bucketName),
		Key:    aws.String(key),
	})

	if err != nil {
		return fmt.Errorf("failed to delete file from S3: %v", err)
	}

	return nil
}

func (client *S3Client) GetBucketName() string {
	return client.bucketName
}

// GeneratePresignedURL genera una URL presignada para acceder a un archivo por tiempo limitado
func (client *S3Client) GeneratePresignedURL(filename string, expiration time.Duration) (string, error) {
	req, _ := client.s3Service.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(client.bucketName),
		Key:    aws.String("adoption-images/" + filename),
	})

	urlStr, err := req.Presign(expiration)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %v", err)
	}

	return urlStr, nil
}
