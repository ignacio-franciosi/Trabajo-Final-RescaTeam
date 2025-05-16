package app

import (
	userController "users/controller"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {
	// Public routes
	router.POST("/register", userController.InsertUser)
	router.POST("/login", userController.Login)

	// Authenticated user - user is account owner (id = endpoint_id) or admin
	router.GET("/user/email/:email", userController.GetUserByEmail)
	router.GET("/user/:id", userController.GetUserById)
	router.PATCH("/user/:id", userController.UpdateUser)
	//router.DELETE("/user/:id", userController.DeleteUser)

	// Only admin
	//router.GET("/reports", userController.ViewReports)
	//router.PATCH("/suspend/:id", userController.SuspendUSer)

	log.Info("Url Mapping ready")
}
