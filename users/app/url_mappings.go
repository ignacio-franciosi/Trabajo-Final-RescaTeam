package app

import (
	log "github.com/sirupsen/logrus"
	reportController "users/controller/report"
	userController "users/controller/user"
)

func mapUrls() {

	/*
	   Users Routes
	*/
	// Public routes
	router.POST("/register", userController.InsertUser)
	router.POST("/login", userController.Login)
	router.POST("/forgot-password", userController.ForgotPassword)
	router.PATCH("/reset-password", userController.ResetPassword)

	// can access: Only if user is account OWNER (and authenticated)
	router.GET("/user/email/:email", userController.GetUserByEmail)
	router.PATCH("/user/:id", userController.UpdateUser)
	router.PATCH("/user/:id/change-password", userController.ChangePassword)

	// can access: if user is account OWNER or ADMIN (both autenticated)
	router.GET("/user/:id", userController.GetUserById)
	router.DELETE("/user/:id", userController.DeleteUser)

	// can access: Only admin
	router.PATCH("user/suspend/:id", userController.SuspendUser) //hace nuevo token con suspended true
	router.PATCH("user/reactivate/:id", userController.ReactivateUser) //hace nuevo token con suspended false
	//router.GET("/reports", userController.ViewReports)


	/*
	   Report Routes
	*/
	// can access: if user is account OWNER or ADMIN (both autenticated)
	router.POST("/report", reportController.InsertReport)
	router.GET("/report/:id", reportController.GetReportById)
	router.DELETE("/report/:id", reportController.DeleteReport)
	router.GET("/report/user/:id", reportController.GetReportsByUserId)

	// can access: Only admin
	router.GET("/report/complainingUser/:id", reportController.GetReportsByComplainingUserId)
	router.PATCH("/report/:id", reportController.UpdateReport) //pasar por body solo adminComment: "xxxx" y reportStatus: "revised"
	router.GET("/report/all", reportController.GetAllReports)
	router.GET("/report/all/:reportStatus", reportController.GetAllReportsByStatus) // /report/all/pending o revised

	log.Info("Url Mapping ready")
}
