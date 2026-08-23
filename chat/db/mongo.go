package db

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// MustConnectMongo conecta a MongoDB usando la URI y DB de variables de entorno.
// Si falla, hace log.Fatal para frenar la app.
func MustConnectMongo() (*mongo.Client, *mongo.Database) {
	uri := os.Getenv("MONGO_URI")
	if uri == "" {
		uri = "mongodb://localhost:27017" // valor por defecto
	}
	env := strings.ToUpper(os.Getenv("ENV"))
	var dbName string
	if env == "QA" {
		dbName = os.Getenv("MONGO_DB_QA")
	} else {
		// For PROD and any other environments (including empty), use MONGO_DB
		dbName = os.Getenv("MONGO_DB")
	}
	if dbName == "" {
		dbName = "rescateam-chatdb"
	}

	log.Println("DB NAME:", dbName)

	// Configuración cliente
	clientOpts := options.Client().ApplyURI(uri)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		log.Fatalf("Error conectando a MongoDB: %v", err)
	}

	// Ping
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("MongoDB no responde: %v", err)
	}

	log.Println("Conectado a MongoDB:", uri)
	return client, client.Database(dbName)
}
