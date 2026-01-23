import io
from urllib.parse import urlparse
from PIL import Image

class ImageRepository:
    def __init__(self, s3_client, bucket_name: str):
        self.s3_client = s3_client
        self.bucket = bucket_name

    def get_image_key(self, image_url: str, prefix: str = "adoption-images/") -> str:
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

    def load_image(self, image_url: str) -> Image.Image:
        image_key = self.get_image_key(image_url)
        obj = self.s3_client.get_object(Bucket=self.bucket, Key=image_key)
        image_bytes = obj["Body"].read()
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
