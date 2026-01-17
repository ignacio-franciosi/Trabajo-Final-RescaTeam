from dotenv import load_dotenv
from pathlib import Path
import os

# Ruta absoluta al root del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(dotenv_path=BASE_DIR / ".env")

QDRANT_URL=os.getenv("QDRANT_URL")
QDRANT_API_KEY=os.getenv("QDRANT_API_KEY")
QDRANT_COLLECTION=os.getenv("QDRANT_COLLECTION")

RABBITMQ_URL=os.getenv("RABBITMQ_URL")
RABBITMQ_QUEUE=os.getenv("RABBITMQ_QUEUE")
CREATE_VECTORS_URL=os.getenv("CREATE_VECTORS_URL")

FRONTEND_BASE_URL=os.getenv("FRONTEND_BASE_URL")

MODEL_API_BASE_URL=os.getenv("MODEL_API_BASE_URL")
MODEL_API_KEY=os.getenv("MODEL_API_KEY")