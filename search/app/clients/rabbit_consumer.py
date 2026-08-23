import json
import aio_pika
import asyncio
import httpx
from app.settings.settings import RABBITMQ_URL, RABBITMQ_QUEUE, CREATE_VECTORS_URL

timeout = httpx.Timeout(
    connect=5.0,     # tiempo para abrir conexión
    read=60.0,       # tiempo máximo esperando respuesta del modelo
    write=10.0,      # tiempo enviando payload
    pool=5.0         # esperando conexión libre
)

async def process_message(message: aio_pika.IncomingMessage):
    try:
        body = json.loads(message.body.decode())
        print(f"Mensaje recibido: {body}")

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(CREATE_VECTORS_URL, json=body)
            response.raise_for_status()
            print(f"POST /vectors/create → {response.status_code}")
        
        await message.ack()

    except Exception as e:
        print(f"Error procesando mensaje: {e}")
        await message.reject(requeue=False)


async def consume():
    connection = await aio_pika.connect_robust(RABBITMQ_URL, heartbeat=60)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)
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
