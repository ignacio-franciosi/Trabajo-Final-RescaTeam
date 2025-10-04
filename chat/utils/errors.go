package utils

import "github.com/gin-gonic/gin"

func AbortWithError(c *gin.Context, code int, msg string) {
	c.JSON(code, gin.H{"error": msg})
	c.Abort()
}
