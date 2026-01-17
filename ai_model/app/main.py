from fastapi import FastAPI, Header, HTTPException, Depends
import uvicorn
import torch
from torchvision import transforms
import boto3
import io
from urllib.parse import urlparse
from PIL import Image
from app.dtos import EmbedRequest, EmbedResponse
from app.model import ResNet50Backbone
from app.settings import AWS_S3_BUCKET_NAME, MODEL_API_KEY, MODEL_WEIGHTS_PATH

app = FastAPI(
    title="AI Model API"
)

device = "cuda" if torch.cuda.is_available() else "cpu"

model = ResNet50Backbone(embedding_dim=2048).to(device)
model.load_state_dict(torch.load(MODEL_WEIGHTS_PATH, map_location=device))
model.eval()

transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]),
])

s3_client = boto3.client("s3")

def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != MODEL_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

def get_image_key(image_url: str, prefix: str = "adoption-images/") -> str:
    parsed_url = urlparse(image_url)
    path = parsed_url.path.lstrip("/")

    if prefix not in path:
        raise ValueError(f"Invalid S3 image url: {image_url}")

    return path[path.index(prefix):]


def load_image_from_s3(image_url: str) -> Image.Image:
    image_key = get_image_key(image_url)
    obj = s3_client.get_object(Bucket=AWS_S3_BUCKET_NAME, Key=image_key)
    image_bytes = obj["Body"].read()
    return Image.open(io.BytesIO(image_bytes)).convert("RGB")


@app.post("/embed",
          response_model=EmbedResponse,
          dependencies=[Depends(verify_api_key)])
def embed(req: EmbedRequest) -> EmbedResponse:
    image = load_image_from_s3(req.image_url)

    tensor = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        embedding = model(tensor).squeeze(0).cpu().numpy().tolist()

    return EmbedResponse(embedding=embedding)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001
    )

