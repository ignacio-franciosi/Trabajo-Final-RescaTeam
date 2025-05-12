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
	router.PUT("/adoptionPost/:id", controllers.UpdateAdoptionPost)

	router.GET("/adoptionPost/filter", controllers.GetFilteredAdoptionPosts)
	//tiene la forma: adoptionPost/filter?species=hembra&size=mediano...
	//rangos predefinidos de age: 0-1, 2-3, 4-7, 8plus
	//para los espacios de las zonas se usa: "barrio%centro"

	log.Info("Listo el mapeo de configuraciones :)")
}
