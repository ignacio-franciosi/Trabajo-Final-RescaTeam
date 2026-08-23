package main

import (
	"chat/app"
	"log"
)

func main() {
	router := app.Bootstrap() // función que arma todo
	log.Fatal(router.Run(":8083"))
}
