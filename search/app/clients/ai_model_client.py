import numpy as np
from PIL import Image
from finetuned_model.model import ResNet50Backbone
from torchvision import transforms
import torch

class AIModelClient:
    def __init__(self, model_path="finetuned_model/best_resnet50_hard_triplet.pth", device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = ResNet50Backbone(embedding_dim=2048).to(self.device)
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.eval()

        self.transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225]),
        ])

    def generate_embedding(self, image: Image) -> np.ndarray: 
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        with torch.no_grad():
            embedding = self.model(tensor)
        return embedding.squeeze(0).cpu().numpy()