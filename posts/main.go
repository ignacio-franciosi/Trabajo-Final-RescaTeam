package main

import (
	"log"
	"posts/app"
	"posts/db"
	utils "posts/utils/cache"
	s3client "posts/utils/s3"

	"github.com/joho/godotenv"
)

func main() {
	// Cargar el archivo .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, proceeding with system environment variables")
	}

	if err := s3client.InitS3Client(); err != nil {
		log.Fatalf("Failed to initialize S3 client: %v", err)
	}
	utils.InitCache()
	db.InitDB()
	app.StartRoute()
}
