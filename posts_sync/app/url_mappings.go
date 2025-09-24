package app

import (
	controllers "posts_sync/controllers"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {
	// Public routes
	router.POST("/vectors/create", controllers.CreateVector)
	router.GET("/vectors/search", controllers.GetSimilarPets)

	log.Info("Url Mapping ready")
}
