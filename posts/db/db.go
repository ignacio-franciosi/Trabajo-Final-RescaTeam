package db

import (
	"context"
	"fmt"

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

	clientOpts := options.Client().ApplyURI("mongodb+srv://rescateam:rescateam@rescateam.gojuwbk.mongodb.net/")

	cli, err := mongo.Connect(context.TODO(), clientOpts)
	client = cli

	if err != nil {
		log.Info("Connection Failed to Open")
		log.Fatal(err)
	} else {
		log.Info("Connection Established")
	}

	dbNames, err := client.ListDatabaseNames(context.TODO(), bson.M{})
	if err != nil {
		log.Info("Failed to get databases available")
		log.Fatal(err)
	}

	MongoDb = client.Database("posts")

	fmt.Println("Available databases:")
	fmt.Println(dbNames)

	// Inicializar las colecciones
	PostsCollection = MongoDb.Collection("posts")
	ImagesCollection = MongoDb.Collection("images")

	log.Info("Collections initialized: posts, images")
}
