package main

import (
	"users/app"
	"users/db"
	"users/utils/queue"
)

func main() {

	db.StartDbEngine()
	queue.QueueProducer.InitQueue()
	app.StartRoute()

}
