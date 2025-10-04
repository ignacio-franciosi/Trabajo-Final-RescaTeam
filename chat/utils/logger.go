package utils

import (
	"log"
	"os"
)

var Logger = log.New(os.Stdout, "[ChatAPI] ", log.LstdFlags|log.Lshortfile)
