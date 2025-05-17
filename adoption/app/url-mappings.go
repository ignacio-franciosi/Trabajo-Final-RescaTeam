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

	//router.PUT("/adoptionPost/:id/adopted", authMiddleware.AuthRequired(), controllers.MarkAdoptionPostAsAdopted)
	router.PUT("/adoptionPost/adopted/:id", controllers.MarkAdoptionPostAsAdopted)
	//tiene la forma: adoptionPost/adopted/2?userId=3

	//router.GET("/myAdoptionPosts", authMiddleware.AuthRequired(), controllers.GetMyAdoptionPosts)
	router.GET("/adoptionPost/user/:userId", controllers.GetAllAdoptionPostsByUserId)

	log.Info("Listo el mapeo de configuraciones :)")
}
