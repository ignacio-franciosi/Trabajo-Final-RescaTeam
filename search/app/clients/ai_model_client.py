from transformers import AutoProcessor, AutoModel
from PIL import Image
import torch
import numpy as np
import requests

MODEL_PATH = "finetuned_model/"

processor = AutoProcessor.from_pretrained(MODEL_PATH)
model = AutoModel.from_pretrained(MODEL_PATH)
model.eval()

def generate_embedding(image_url: str) -> np.ndarray:
    if image_url.startswith("http"):
        image = Image.open(requests.get(image_url, stream=True).raw).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        embedding = outputs.pooler_output[0].numpy()
    return embedding