package main

import (
	"auth/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.POST("/verify", middleware.VerifyTokenHandler)

	r.Run(":8082")
}
