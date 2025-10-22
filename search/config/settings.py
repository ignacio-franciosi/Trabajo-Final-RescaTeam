from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env")

AWS_ACCESS_KEY_ID=os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION=os.getenv("AWS_REGION")
AWS_S3_BUCKET_NAME=os.getenv("AWS_S3_BUCKET_NAME")

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION=os.getenv("QDRANT_COLLECTION")

RABBITMQ_URL = os.getenv("RABBITMQ_URL")
RABBITMQ_QUEUE = os.getenv("RABBITMQ_QUEUE")
CREATE_VECTORS_URL = os.getenv("CREATE_VECTORS_URL")