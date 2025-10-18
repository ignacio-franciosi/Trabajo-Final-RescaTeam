import boto3
import io
import os
from urllib.parse import urlparse
from PIL import Image

s3_client = boto3.client("s3")
S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME")

def get_image_key(image_url: str, prefix: str = "adoption-images/") -> str:
    """
        Extrae la key del objeto S3 a partir de la URL completa.
        Ejemplo:
            https://bucket-name.s3.us-east-1.amazonaws.com/adoption-images/filename.jpg
        Devuelve:
            adoption-images/filename.jpg
    """

    parsed_url = urlparse(image_url)
    path = parsed_url.path.lstrip("/")

    if prefix in path:
        image_key = path[path.index(prefix):]
        return image_key
    else:
        raise ValueError(f"Formato de URL inválido, no contiene el prefijo '{prefix}': {image_url}")

def load_image_from_s3(image_url: str) -> Image.Image:
    image_key = get_image_key(image_url)
    obj = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=image_key)
    image_bytes = obj["Body"].read()
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")
