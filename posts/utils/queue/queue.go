package queue

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"posts/dto"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	log "github.com/sirupsen/logrus"
)

var conn *amqp.Connection
var usersQueue amqp.Queue
var searchQueue amqp.Queue

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

	channel, err := conn.Channel()
	if err != nil {
		log.Info("Failed to open channel")
		log.Fatal(err)
	} else {
		log.Info("Channel opened")
	}
	defer channel.Close()

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

func ensureConnection() error {
	if conn != nil && !conn.IsClosed() {
		return nil
	}

	url := os.Getenv("RABBITMQ_URL")
	if url == "" {
		return errors.New("RABBITMQ_URL not set")
	}

	var err error
	conn, err = amqp.Dial(url)
	if err != nil {
		return err
	}

	log.Warn("RabbitMQ reconnected")
	return nil
}

func SetMessageHandler(handler MessageHandler) {
	messageHandler = handler
}

func Consume() {
	for {
		// 1. Asegurar conexión viva
		if err := ensureConnection(); err != nil {
			log.Error("Cannot connect to RabbitMQ, retrying...", err)
			time.Sleep(5 * time.Second)
			continue
		}

		// 2. Abrir channel dedicado al consumer
		ch, err := conn.Channel()
		if err != nil {
			log.Error("Failed to open channel, retrying...", err)
			time.Sleep(5 * time.Second)
			continue
		}

		log.Info("Consumer channel opened")

		// 3. Crear consumer
		msgs, err := ch.Consume(
			usersQueue.Name,
			"users-events",
			true, // auto-ack (ok para tu caso)
			false,
			false,
			false,
			nil,
		)
		if err != nil {
			log.Error("Failed to start consumer, retrying...", err)
			ch.Close()
			time.Sleep(5 * time.Second)
			continue
		}

		log.Info("Consuming users-events")

		// 4. Loop de mensajes
		for msg := range msgs {
			var jsonMessage dto.QueueMessageDto

			if err := json.Unmarshal(msg.Body, &jsonMessage); err != nil {
				log.Error("Error unmarshalling message:", err)
				continue
			}

			if messageHandler != nil {
				if err := messageHandler(jsonMessage); err != nil {
					log.Error("Error handling queue message:", err)
				}
			}
		}

		// 5. Si salimos del range → Rabbit o channel murió
		log.Warn("Consumer channel closed, reconnecting...")
		ch.Close()
		time.Sleep(2 * time.Second)
	}
}

func PublishToSearch(body []byte) error {

	if err := ensureConnection(); err != nil {
		return err
	}

	channel, err := conn.Channel()
	if err != nil {
		return err
	}
	defer channel.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	log.Info("Publishing message to search queue: ", string(body))

	return channel.PublishWithContext(
		ctx,
		"",
		searchQueue.Name,
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})

}
