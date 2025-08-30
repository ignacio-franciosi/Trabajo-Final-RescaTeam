package app

import (
	"posts/controllers"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {

	//PUBLIC ROUTES

	router.GET("/post/:id", controllers.GetPostById)
	router.GET("/post", controllers.GetAllPosts)
	//Si no le paso nada trae todos, sino trae por tipo, ej: ?type=adoption|lost|found
	router.GET("/post/filter", controllers.GetFilteredPosts)
	//tiene la forma: post/filter?species=hembra&size=mediano...
	//rangos predefinidos de age: 0-1, 2-3, 4-7, 8plus [ej: post/filter?species=hembra&size=mediano&age=0-1]
	//para los espacios de las zonas se usa: "barrio%centro"
	//hay que ir concatenando los parametros de la url segun los filtros que el usuario va seleccionando
	router.GET("/post/images/:id", controllers.GetImagesByPostId)

	//PRIVATE ROUTES (REQUIRE TOKEN)

	router.POST("/post", controllers.InsertPost) //no se hace con JSON, se hace con form-data
	router.DELETE("/post/:id", controllers.DeletePost)
	router.PUT("post/:id", controllers.UpdatePost)
	router.POST("/post/images/upload", controllers.UploadImage)
	router.DELETE("post/images/:idImage", controllers.DeleteImageById)
	router.DELETE("post/images/deleteall/:postId", controllers.DeleteAllImagesByPostId)
	router.PUT("/post/resolved/:id", controllers.MarkPostAsResolved)
	router.GET("/post/user/:userId", controllers.GetAllPostsByUserId) //mis publicaciones
	router.DELETE("/post/user/:userId", controllers.DeleteAllPostsByUserId) // eliminar cuenta

	log.Info("Url mapping ready")
}
