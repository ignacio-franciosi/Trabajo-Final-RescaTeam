package app

import (
	userController "users/controller"

	log "github.com/sirupsen/logrus"
)

func mapUrls() {
	// Public routes
	router.POST("/register", userController.InsertUser)
	router.POST("/login", userController.Login)
	router.POST("/forgot-password", userController.ForgotPassword)
	router.PATCH("/reset-password", userController.ResetPassword)

	// can access: Only if User is Authenticated and account owner (id = endpoint_id)
	router.GET("/user/email/:email", userController.GetUserByEmail)
	router.PATCH("/user/:id", userController.UpdateUser)
	router.PATCH("/user/:id/change-password", userController.ChangePassword)

	// can access: if User is Authenticated and account owner (id = endpoint_id) or ADMIN
	router.GET("/user/:id", userController.GetUserById)
	router.DELETE("/user/:id", userController.DeleteUser)

	// can access: Only admin
	//router.GET("/reports", userController.ViewReports)
	//router.PATCH("/suspend/:id", userController.SuspendUser)

	log.Info("Url Mapping ready")
}
