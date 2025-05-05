package app

import (
	"adoption/controllers"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {

	// URL mappings

	router.POST("/adoptionPost", controllers.InsertAdoptionPost)
	router.GET("/adoptionPost/:id", controllers.GetAdoptionPostById)
	router.DELETE("/adoptionPost/:id", controllers.DeleteAdoptionPost)
	router.GET("/adoptionPost", controllers.GetAllAdoptionPosts)
	//router.PUT("/apotionPost/:id", controllers.UpdateAdoptionPost)

	log.Info("Listo el mapeo de configuraciones :)")
}
