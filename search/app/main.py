from fastapi import FastAPI
from consumer import start_in_background
from services.embedding_service import EmbeddingService
from dto.search_dtos import CreateEmbeddingDto, SearchPetDto

app = FastAPI(
    title = "RescaTeam search API",
    description = "API to generate vector embeddings"
)

# Iniciar consumidor RabbitMQ en segundo plano
start_in_background()

@app.post("/vectors/create")
async def create_vector(request: CreateEmbeddingDto):
    qdrant_id = EmbeddingService.create_vector(request)

    return {"status": "success", "qdrant_id": qdrant_id}

@app.get("/vectors/search")
def search(request: SearchPetDto):
    results_ids = EmbeddingService.search_vector(request)
    return {"matches": results_ids}