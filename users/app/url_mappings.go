package app

import (
	userController "users/controller"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {
	// Users Mapping
	router.GET("/user/:id", userController.GetUserById)
	router.POST("/register", userController.InsertUser)
	router.POST("/login", userController.Login)
	router.GET("/login", userController.Login)
	router.GET("/user/email/:email", userController.GetUserByEmail)

	// router.DELETE("/user/:id", userController.DeleteUser)
	//router.GET("/reports", userController.ViewReports)
	//suspend user

	log.Info("Url Mapping ready")
}
