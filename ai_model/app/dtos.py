from pydantic import BaseModel
from typing import List

class EmbedRequest(BaseModel):
    image_url: str

class EmbedResponse(BaseModel):
    embedding: List[float]