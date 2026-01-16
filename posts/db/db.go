package db

import (
	"context"
	"fmt"
	"os"
	"strings"

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
	env := strings.ToUpper(os.Getenv("ENV"))
	var dbName string
	if env == "QA" {
		dbName = os.Getenv("MONGO_DB_QA")
	} else {
		// For PROD and any other environments (including empty), use MONGO_DB
		dbName = os.Getenv("MONGO_DB")
	}
	if dbName == "" {
		dbName = "posts"
	}

	log.Println("DB NAME:", dbName)

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

	// Inicializar las colecciones
	PostsCollection = MongoDb.Collection("posts")
	ImagesCollection = MongoDb.Collection("images")

	log.Infof("Collections initialized in DB '%s':", dbName)
}
