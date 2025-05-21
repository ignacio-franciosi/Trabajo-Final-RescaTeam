package app

import (
	"adoption/controllers"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {

	// URL mappings

	router.POST("/adoptionPost", controllers.InsertAdoptionPost)       //with auth user/admin
	router.GET("/adoptionPost/:id", controllers.GetAdoptionPostById)   // no auth (cualquiera puede ver)
	router.DELETE("/adoptionPost/:id", controllers.DeleteAdoptionPost) // with auth user/admin
	router.GET("/adoptionPost", controllers.GetAllAdoptionPosts)       //no auth (cualquiera puede ver)
	router.PUT("/adoptionPost/:id", controllers.UpdateAdoptionPost)    // with auth user/admin

	router.GET("/adoptionPost/filter", controllers.GetFilteredAdoptionPosts) //no auth (cualquiera puede)
	//tiene la forma: adoptionPost/filter?species=hembra&size=mediano...
	//rangos predefinidos de age: 0-1, 2-3, 4-7, 8plus [ej: adoptionPost/filter?species=hembra&size=mediano&age=0-1]
	//para los espacios de las zonas se usa: "barrio%centro"
	//hay que ir concatenando los parametros de la url segun los filtros que el usuario va seleccionando

	router.PUT("/adoptionPost/adopted/:id", controllers.MarkAdoptionPostAsAdopted) //with auth user/admin
	//tiene la forma: adoptionPost/adopted/2?userId=3 (estoy marcando la publicacion 2 y soy el usuario 3)

	router.GET("/adoptionPost/user/:userId", controllers.GetAllAdoptionPostsByUserId) //with auth user/admin

	router.POST("adoptionPost/images/upload", controllers.UploadAdoptionImage)
	router.GET("/adoptionPost/images/:id", controllers.GetImagesByAdoptionPostId)

	log.Info("Listo el mapeo de configuraciones :)")
}
