package app

import (
	"adoption/controllers"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {

	// URL mappings

	router.POST("/adoptionPost", controllers.InsertAdoptionPost)

	log.Info("Listo el mapeo de configuraciones :)")
}
