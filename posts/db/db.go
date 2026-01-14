package db

import (
	"context"
	"fmt"
	"os"

	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoDb *mongo.Database
var client *mongo.Client

// Nuevas colecciones
var PostsCollection *mongo.Collection
var ImagesCollection *mongo.Collection

func DisconnectDB() {
	err := client.Disconnect(context.TODO())
	if err != nil {
		log.Fatal(err)
	}
	log.Info("Disconnected from MongoDB")
}

func InitDB() {
	// Cargar variables de entorno
	err := godotenv.Load()
	if err != nil {
		log.Warn("No .env file found, using system environment variables")
	}

	// Leer valores de .env
	mongoURI := os.Getenv("MONGO_URI")
	dbName := os.Getenv("MONGO_DB")

	if mongoURI == "" || dbName == "" {
		log.Fatal("MONGO_URI or MONGO_DB not set in environment")
	}

	// Conexión
	clientOpts := options.Client().ApplyURI(mongoURI)
	cli, err := mongo.Connect(context.TODO(), clientOpts)
	client = cli

	if err != nil {
		log.Fatal("Connection Failed to Open: ", err)
	} else {
		log.Info("Connection Established")
	}

	dbNames, err := client.ListDatabaseNames(context.TODO(), bson.M{})
	if err != nil {
		log.Fatal("Failed to get databases available: ", err)
	}

	MongoDb = client.Database(dbName)

	fmt.Println("Available databases:")
	fmt.Println(dbNames)

	// Determinar nombres de colecciones basándose en el entorno
	env := os.Getenv("ENV")
	var postsCollectionName, imagesCollectionName string

	if env == "QA" {
		postsCollectionName = os.Getenv("POSTS_COLLECTION_QA")
		imagesCollectionName = os.Getenv("IMAGES_COLLECTION_QA")
	} else if env == "PROD" {
		postsCollectionName = os.Getenv("POSTS_COLLECTION_PROD")
		imagesCollectionName = os.Getenv("IMAGES_COLLECTION_PROD")
	} else {
		// Por defecto o si ENV no está definido
		postsCollectionName = "posts"
		imagesCollectionName = "images"
	}

	// Inicializar las colecciones
	PostsCollection = MongoDb.Collection(postsCollectionName)
	ImagesCollection = MongoDb.Collection(imagesCollectionName)

	log.Infof("Collections initialized in DB '%s': %s, %s", dbName, postsCollectionName, imagesCollectionName)
}
