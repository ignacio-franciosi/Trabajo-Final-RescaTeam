package app

import (
	userController "users/controller"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {
	// Public routes
	router.POST("/register", userController.InsertUser)
	router.POST("/login", userController.Login)

	// User is Authenticated and account owner (id = endpoint_id)
	router.GET("/user/email/:email", userController.GetUserByEmail)
	router.PATCH("/user/:id", userController.UpdateUser)
	router.PATCH("/user/:id/change-password", userController.ChangePassword)

	// User is Authenticated and account owner (id = endpoint_id) or ADMIN
	router.GET("/user/:id", userController.GetUserById)
	//router.DELETE("/user/:id", userController.DeleteUser)

	// Only admin
	//router.GET("/reports", userController.ViewReports)
	//router.PATCH("/suspend/:id", userController.SuspendUser)

	log.Info("Url Mapping ready")
}
