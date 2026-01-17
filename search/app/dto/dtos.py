from pydantic import BaseModel
from typing import Literal

class EmbedRequest(BaseModel):
    image_url: str

class CreateEmbeddingDto(BaseModel):
    post_id: str
    post_type: Literal["lost", "found"]
    image_url: str
    species: Literal["perro", "gato"]

class SearchPetDto(BaseModel):
    post_id: str
    post_type: Literal["lost", "found"]
    species: Literal["perro", "gato"]