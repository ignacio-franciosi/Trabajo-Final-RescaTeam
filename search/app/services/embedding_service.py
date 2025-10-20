from app.clients import qdrant_client
from app.dto.dtos import CreateEmbeddingDto, SearchPetDto
from app.clients.s3_client import load_image_from_s3

class EmbeddingService:

    @staticmethod
    def create_vector(ai_client, request: CreateEmbeddingDto) -> str:
        image = load_image_from_s3(request.image_url)
        vector = ai_client.generate_embedding(image)
        qdrant_id = qdrant_client.save_embedding(request=request, vector=vector)
        return qdrant_id

    @staticmethod
    def search_vector(request: SearchPetDto) -> list[str]:
        similar_pets = qdrant_client.search_embedding(request)
        return [pet.payload.get("post_id") for pet in similar_pets]
