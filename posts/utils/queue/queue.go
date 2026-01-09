package queue

import (
	"context"
	"encoding/json"
	"posts/dto"
	"time"
	"os"
	amqp "github.com/rabbitmq/amqp091-go"
	log "github.com/sirupsen/logrus"
)

var usersQueue amqp.Queue
var searchQueue amqp.Queue
var channel *amqp.Channel

// Handler function type for processing queue messages
type MessageHandler func(messageDto dto.QueueMessageDto) error

var messageHandler MessageHandler

func InitQueue() {
	url := os.Getenv("RABBITMQ_URL")
	if url == "" {
		log.Fatal("RABBITMQ_URL not set")
	}

	conn, err := amqp.Dial(url)
	if err != nil {
		log.Info("Failed to connect to RabbitMQ")
		log.Fatal(err)
	} else {
		log.Info("RabbitMQ connection established")
	}

	channel, err = conn.Channel()
	if err != nil {
		log.Info("Failed to open channel")
		log.Fatal(err)
	} else {
		log.Info("Channel opened")
	}

	// Declare users queue for consuming
	usersQueue, err = channel.QueueDeclare(
		"users-events",
		true,
		false,
		false,
		false,
		nil,
	)

	if err != nil {
		log.Info("Failed to declare users queue")
		log.Fatal(err)
	} else {
		log.Info("Users queue declared successfully - Name: ", usersQueue.Name, " Messages: ", usersQueue.Messages, " Consumers: ", usersQueue.Consumers)
	}

	// Declare search queue for producing
	searchQueue, err = channel.QueueDeclare(
		"posts-search-events",
		true,
		false,
		false,
		false,
		nil,
	)

	if err != nil {
		log.Info("Failed to declare search queue")
		log.Fatal(err)
	} else {
		log.Info("Search queue declared successfully - Name: ", searchQueue.Name, " Messages: ", searchQueue.Messages, " Consumers: ", searchQueue.Consumers)
	}
}

func SetMessageHandler(handler MessageHandler) {
	messageHandler = handler
}

func Consume() {

	msgs, err := channel.Consume(
		usersQueue.Name,
		"users-events",
		true,
		false,
		false,
		true,
		nil,
	)
	if err != nil {
		log.Error("Failed to publish consumer", err)
	}

	for msg := range msgs {

		var jsonMessage dto.QueueMessageDto

		err = json.Unmarshal(msg.Body, &jsonMessage)

		if err != nil {
			log.Error("Error:", err)
		}

		if messageHandler != nil {
			err := messageHandler(jsonMessage)
			if err != nil {
				log.Error("Error handling queue message:", err)
			}
		}
	}
}

func PublishToSearch(body []byte) error {

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	log.Info("Publishing message to search queue: ", string(body))

	err := channel.PublishWithContext(
		ctx,
		"",
		searchQueue.Name,
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})

	if err != nil {
		log.Debug("Error while publishing message to search queue", err)
		return err
	}

	return nil
}
