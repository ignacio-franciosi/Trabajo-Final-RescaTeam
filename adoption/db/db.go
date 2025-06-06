package db

import (
	"os"

	"github.com/ignacio-franciosi/Trabajo-Final-RescaTeam/adoption/clients"
	model "github.com/ignacio-franciosi/Trabajo-Final-RescaTeam/adoption/model"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var (
	db  *gorm.DB
	err error
)

func init() {
	// Cargamos las variables de entorno desde el archivo .env
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Obtenemos la cadena de conexión de la variable de entorno
	dbConnString := os.Getenv("DBCONNSTRING_DEPLOY")

	// Abrimos la conexión a la base de datos utilizando la variable
	db, err = gorm.Open(mysql.Open(dbConnString), &gorm.Config{})

	if err != nil {
		log.Info("Connection Failed to Open")
		log.Fatal(err)
	} else {
		log.Info("Connection Established")
	}

	// Add all clients here

	clients.Db = db

}

func StartDbEngine() {
	// We need to migrate all classes model.
	db.AutoMigrate(&model.AdoptionPost{})
	db.AutoMigrate(&model.AdoptionImage{})

	log.Info("Finishing Migration Database Tables :)")
}
