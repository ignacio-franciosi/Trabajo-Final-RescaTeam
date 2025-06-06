package app

import (
	"github.com/ignacio-franciosi/Trabajo-Final-RescaTeam/adoption/controllers"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {

	//PUBLIC ROUTES

	router.GET("/adoptionPost/:id", controllers.GetAdoptionPostById)
	router.GET("/adoptionPost", controllers.GetAllAdoptionPosts)
	router.GET("/adoptionPost/filter", controllers.GetFilteredAdoptionPosts)
	//tiene la forma: adoptionPost/filter?species=hembra&size=mediano...
	//rangos predefinidos de age: 0-1, 2-3, 4-7, 8plus [ej: adoptionPost/filter?species=hembra&size=mediano&age=0-1]
	//para los espacios de las zonas se usa: "barrio%centro"
	//hay que ir concatenando los parametros de la url segun los filtros que el usuario va seleccionando
	router.GET("/adoptionPost/images/:id", controllers.GetImagesByAdoptionPostId)

	//PRIVATE ROUTES (REQUIRE TOKEN)

	router.POST("/adoptionPost", controllers.InsertAdoptionPost) //no se hace con JSON, se hace con form-data
	router.DELETE("/adoptionPost/:id", controllers.DeleteAdoptionPost)
	router.PUT("adoptionPost/:id", controllers.UpdateAdoptionPost)
	router.POST("/adoptionPost/images/upload", controllers.UploadAdoptionImage)
	router.DELETE("adoptionPost/images/:idImage", controllers.DeleteImageById)
	router.DELETE("adoptionPost/images/deleteall/:idAdPost", controllers.DeleteAllImagesByAdoptionPostId)
	router.PUT("/adoptionPost/adopted/:id", controllers.MarkAdoptionPostAsAdopted)
	router.GET("/adoptionPost/user/:userId", controllers.GetAllAdoptionPostsByUserId) //mis publicaciones

	log.Info("Url mapping ready")
}
