package app

import (
	userController "users/controller"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {
	// Public routes
	router.POST("/register", userController.InsertUser)
	router.POST("/login", userController.Login)

	// Authenticated user - with same user id or admin
	router.GET("/user/email/:email", userController.GetUserByEmail)
	router.GET("/user/:id", userController.GetUserById)
	router.PATCH("/user", userController.UpdateUser)
	//router.DELETE("/user/:id", userController.DeleteUser)

	// Only admin
	//router.GET("/reports", userController.ViewReports)
	//router.PATCH("/suspend", userController.SuspendUSer)

	log.Info("Url Mapping ready")
}
