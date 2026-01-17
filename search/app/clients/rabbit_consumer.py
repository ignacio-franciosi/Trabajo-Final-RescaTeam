import json
import aio_pika
import asyncio
import httpx
from app.config.settings import RABBITMQ_URL, RABBITMQ_QUEUE, CREATE_VECTORS_URL

async def process_message(message: aio_pika.IncomingMessage):
    async with message.process():
        try:
            body = json.loads(message.body.decode())
            print(f"Mensaje recibido: {body}")

            async with httpx.AsyncClient() as client:
                response = await client.post(CREATE_VECTORS_URL, json=body)
                print(f"POST /vectors/create → {response.status_code}")
        except Exception as e:
            print(f"Error procesando mensaje: {e}")


async def consume():
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    channel = await connection.channel()
    queue = await channel.declare_queue(RABBITMQ_QUEUE, durable=True)

    print(f"Escuchando mensajes en la cola '{RABBITMQ_QUEUE}'")
    await queue.consume(process_message)

    await asyncio.Future()

async def start_consumer():
    while True:
        try:
            await consume()
        except Exception as e:
            print("RabbitMQ connection failed, retrying in 5s:", e)
            await asyncio.sleep(5)
