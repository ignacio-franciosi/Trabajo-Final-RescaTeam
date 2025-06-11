package main

import (
	"adoption/app"
	"adoption/db"
	utils "adoption/utils/cache"
	s3client "adoption/utils/s3"
	"log"
)

func main() {

	if err := s3client.InitS3Client(); err != nil {
		log.Fatalf("Failed to initialize S3 client: %v", err)
	}
	utils.InitCache()
	db.StartDbEngine()
	app.StartRoute()

}
