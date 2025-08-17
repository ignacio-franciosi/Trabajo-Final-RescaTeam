package utils

import "log"

func LogInfo(msg string) {
	log.Printf("ℹ️ %s\n", msg)
}

func LogError(msg string) {
	log.Printf("❌ %s\n", msg)
}
