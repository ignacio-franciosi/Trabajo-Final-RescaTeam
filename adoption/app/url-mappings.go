package app

import (
	"adoption/controllers"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {

	// URL mappings

	router.POST("/adoptionPost", controllers.InsertAdoptionPost)
	router.GET("/adoptionPost/:id", controllers.GetHotelById)
	router.DELETE("/adoptionPost/:id", controllers.DeleteAdoptionPost)

	log.Info("Listo el mapeo de configuraciones :)")
}
