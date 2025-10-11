from clients import model_client, qdrant_client
from search.app.dto.dtos import CreateEmbeddingDto, SearchPetDto

class EmbeddingService:

    @staticmethod
    def create_vector(request: CreateEmbeddingDto) -> str:
        # descargar imagen de s3
        vector = model_client.generate_embedding(request.image_url)
        qdrant_id = qdrant_client.insert_embedding(request=request, vector=vector)
        return qdrant_id

    @staticmethod
    def search_vector(request: SearchPetDto) -> list[str]:
        similar_pets = qdrant_client.search_embedding(request)
        return [pet.payload.get("post_id") for pet in similar_pets]
