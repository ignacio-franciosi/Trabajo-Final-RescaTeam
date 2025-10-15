package main

import (
	"log"
	"posts/app"
	"posts/db"
	"posts/utils/queue"
	utils "posts/utils/cache"
	s3client "posts/utils/s3"
	"sync"
	"github.com/joho/godotenv"
)

func main() {
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found, proceeding with system environment variables")
    }

    if err := s3client.InitS3Client(); err != nil {
        log.Fatalf("Failed to initialize S3 client: %v", err)
    }

    queue.InitQueue()

    var wg sync.WaitGroup
    wg.Add(1)
    go func() {
        defer wg.Done()
        queue.Consume()
    }()

    utils.InitCache()
    
    db.InitDB()
      
    app.StartRoute()

    wg.Wait()
}

