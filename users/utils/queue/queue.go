package queue

import (
	"context"
	"fmt"
	"time"
	"os"
	amqp "github.com/rabbitmq/amqp091-go"
	log "github.com/sirupsen/logrus"
)

var queue amqp.Queue
var channel *amqp.Channel

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

	channel, err = conn.Channel()
	if err != nil {
		log.Info("Failed to open channel")
		log.Fatal(err)
	} else {
		log.Info("Channel opened")
	}

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
		log.Info("Queue declared")
	}
}

func (q queueProducer) Publish(body []byte) error {

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	fmt.Println("body que se le pasa al publish", body)

	err := channel.PublishWithContext(
		ctx,
		"",
		queue.Name,
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		})

	if err != nil {
		log.Debug("Error while publishing message", err)
		return err
	}

	return nil
}
