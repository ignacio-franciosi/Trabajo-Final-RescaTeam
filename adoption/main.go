package main

import (
	"adoption/app"
	"adoption/db"
	utils "adoption/utils/cache"
)

func main() {
	utils.InitCache()
	db.StartDbEngine()
	app.StartRoute()

}
