from fastapi import FastAPI
import uvicorn
from contextlib import asynccontextmanager
#from consumer import start_in_background
from app.services.embedding_service import EmbeddingService
from app.dto.dtos import CreateEmbeddingDto, SearchPetDto
from app.clients.qdrant_client import init_qdrant_collection
from app.clients.ai_model_client import AIModelClient

ai_client: AIModelClient = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ai_client
    ai_client = AIModelClient("finetuned_model/best_resnet50_hard_triplet.pth")
    init_qdrant_collection()
    yield

app = FastAPI(
    title = "RescaTeam search API",
    description = "API to generate vector embeddings",
    lifespan=lifespan
)

# Iniciar consumidor RabbitMQ en segundo plano
#start_in_background()

@app.post("/vectors/create")
async def create_vector(request: CreateEmbeddingDto):
    qdrant_id = EmbeddingService.create_vector(ai_client, request)

    return {"status": "success", "qdrant_id": qdrant_id}

@app.get("/vectors/search")
def search(request: SearchPetDto):
    results_ids = EmbeddingService.search_vector(request)
    return {"matches": results_ids}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
