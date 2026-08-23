package db

import (
	"os"
	userClient "users/clients/user"
	reportClient "users/clients/report"
	model "users/model"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
	log "github.com/sirupsen/logrus"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var (
	db  *gorm.DB
)

func init() {
	// Cargamos las variables de entorno desde el archivo .env
	err := godotenv.Load()
	if err != nil {
		log.Warn("No .env file found, using system environment variables")
	}

	// Obtenemos la cadena de conexión de la variable de entorno
	dbConnString := os.Getenv("DBCONNSTRING")
	//dbConnString := os.Getenv("DBCONNSTRING_DOCKER") // Docker

	// Abrimos la conexión a la base de datos utilizando la variable
	db, err = gorm.Open(mysql.Open(dbConnString), &gorm.Config{})

	if err != nil {
		log.Info("Connection Failed to Open")
		log.Fatal(err)
	} else {
		log.Info("Connection Established")
	}

	// Add all clients here

	userClient.Db = db
	reportClient.Db = db

}

func StartDbEngine() {
	// We need to migrate all classes model.
	db.AutoMigrate(&model.User{})
	db.AutoMigrate(&model.Report{})

	log.Info("Finishing Migration Database Tables :)")
}
