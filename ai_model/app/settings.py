from dotenv import load_dotenv
from pathlib import Path
import os

# Ruta absoluta al root del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(dotenv_path=BASE_DIR / ".env")

AWS_ACCESS_KEY_ID=os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY=os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION=os.getenv("AWS_REGION")
AWS_S3_BUCKET_NAME=os.getenv("AWS_S3_BUCKET_NAME")

MODEL_API_KEY=os.getenv("MODEL_API_KEY")
MODEL_WEIGHTS_PATH=os.getenv("MODEL_WEIGHTS_PATH")