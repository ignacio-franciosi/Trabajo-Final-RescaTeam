import torch.nn as nn
import torch.nn.functional as F
import torchvision.models as models

class ResNet50Backbone(nn.Module):
    def __init__(self, embedding_dim=2048):
        super().__init__()
        resnet = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)

        # Quitar la capa de clasificación final
        self.backbone = nn.Sequential(*list(resnet.children())[:-1])
        self.embedding = nn.Linear(2048, embedding_dim)
        self.embedding_dim = embedding_dim

    def forward(self, x):
        x = self.backbone(x)
        x = x.flatten(1)
        x = self.embedding(x)
        x = F.normalize(x, p=2, dim=1)
        return x