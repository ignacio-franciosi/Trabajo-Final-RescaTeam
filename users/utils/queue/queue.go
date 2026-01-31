package queue

import (
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
	log "github.com/sirupsen/logrus"
)

var conn *amqp.Connection
var queue amqp.Queue

type queueProducer struct{}

type queueProducerInterface interface {
	InitQueue()
	Publish(body []byte) error
}

var QueueProducer queueProducerInterface

func init() {
	QueueProducer = queueProducer{}
}

func (q queueProducer) InitQueue() {
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

	queue, err = channel.QueueDeclare(
		"users-events",
		true,
		false,
		false,
		false,
		nil,
	)

	if err != nil {
		log.Info("Failed to declare a queue")
		log.Fatal(err)
	} else {
		log.Info("Queue declared successfully")
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

func (q queueProducer) Publish(body []byte) error {
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

	fmt.Println("body que se le pasa al publish", body)

	return channel.PublishWithContext(
		ctx,
		"",
		queue.Name,
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})

}
