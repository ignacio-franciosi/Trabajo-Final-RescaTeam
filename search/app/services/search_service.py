from app.dto.dtos import CreateEmbeddingDto, SearchPetDto
from app.repositories.vector_repository import VectorRepository
from app.repositories.image_repository import ImageRepository
from app.clients.ai_model_client import AIModelClient

class SearchService:

    def __init__(
        self,
        ai_client: AIModelClient,
        vector_repo: VectorRepository,
        image_repo: ImageRepository
    ):
        self.ai_client = ai_client
        self.vector_repo = vector_repo
        self.image_repo = image_repo

    async def create_vector(self, request: CreateEmbeddingDto) -> str:
        image = self.image_repo.load_image(request.image_url)
        vector = self.ai_client.generate_embedding(image)
        qdrant_id = self.vector_repo.save_embedding(request=request, vector=vector)
        return qdrant_id

    async def search_vector(self, request: SearchPetDto) -> list[str]:
        similar_pets = self.vector_repo.search_embedding(request)
        return [pet.payload.get("post_id") for pet in similar_pets]
