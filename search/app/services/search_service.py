import numpy as np
from app.clients import qdrant_client
from app.clients.ai_model_api_client import AiModelApiClient
from app.dto.dtos import CreateEmbeddingDto, SearchPetDto

class SearchService:
    def __init__(self, ai_client: AiModelApiClient):
        self.ai_client = ai_client

    async def create_vector(self, request: CreateEmbeddingDto) -> str:
        vector = await self.ai_client.generate_embedding(request.image_url)
        qdrant_id = qdrant_client.save_embedding(request=request, vector=np.array(vector))
        return qdrant_id

    def search_vector(self, request: SearchPetDto) -> list[str]:
        similar_pets = qdrant_client.search_embedding(request)
        return [pet.payload.get("post_id") for pet in similar_pets]
