from pydantic import BaseModel
from typing import Optional, List, Literal

class CreateEmbeddingDto(BaseModel):
    post_id: str
    post_type: Literal["lost", "found"]
    image_url: str
    #species: Literal["Perro", "Gato"]

class SearchPetDto(BaseModel):
    post_id: str
    post_type: Literal["lost", "found"]
    #species: Literal["Perro", "Gato"]