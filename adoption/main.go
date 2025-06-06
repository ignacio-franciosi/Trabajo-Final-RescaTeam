package main

import (
	"github.com/ignacio-franciosi/Trabajo-Final-RescaTeam/adoption/app"
	"github.com/ignacio-franciosi/Trabajo-Final-RescaTeam/adoption/db"
	utils "github.com/ignacio-franciosi/Trabajo-Final-RescaTeam/adoption/utils/cache"
)

func main() {
	utils.InitCache()
	db.StartDbEngine()
	app.StartRoute()

}
