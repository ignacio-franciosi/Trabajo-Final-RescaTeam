import os
import boto3
from app.settings.settings import MODEL_BUCKET, MODEL_KEY

def ensure_model_downloaded(local_path: str):
    bucket = MODEL_BUCKET
    key = MODEL_KEY

    if not bucket or not key:
        raise RuntimeError("MODEL_BUCKET or MODEL_KEY not set")

    if os.path.exists(local_path):
        print("Model already exists locally")
        return

    print("Downloading model from S3...")
    os.makedirs(os.path.dirname(local_path), exist_ok=True)

    s3 = boto3.client("s3")
    s3.download_file(bucket, key, local_path)

    print("Model downloaded successfully")
