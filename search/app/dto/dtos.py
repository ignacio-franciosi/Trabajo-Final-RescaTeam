from pydantic import BaseModel
from typing import Optional, List, Literal

class CreateEmbeddingDto(BaseModel):
    post_id: str
    post_type: Literal["Lost", "Found"]
    image_url: str
    #species: Literal["Perro", "Gato"]

class SearchPetDto(BaseModel):
    post_id: str
    post_type: Literal["Lost", "Found"]
    #species: Literal["Perro", "Gato"]