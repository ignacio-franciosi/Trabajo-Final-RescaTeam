from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
from contextlib import asynccontextmanager
from app.services.embedding_service import EmbeddingService
from app.dto.dtos import CreateEmbeddingDto, SearchPetDto
from app.clients.qdrant_client import init_qdrant_collection
from app.clients.rabbit_consumer import consume
from app.clients.ai_model_client import AIModelClient
from config.settings import FRONTEND_BASE_URL

ai_client: AIModelClient = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global ai_client
    ai_client = AIModelClient("finetuned_model/best_resnet50_hard_triplet.pth")
    init_qdrant_collection()
    asyncio.create_task(consume()) # Iniciar consumidor RabbitMQ en segundo plano
    yield

app = FastAPI(
    title = "RescaTeam search API",
    description = "API to generate vector embeddings",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_BASE_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/vectors/create")
async def create_vector(request: CreateEmbeddingDto):
    qdrant_id = EmbeddingService.create_vector(ai_client, request)

    return {"status": "success", "qdrant_id": qdrant_id}

@app.get("/vectors/search")
def search(request: SearchPetDto = Depends()):
    results_ids = EmbeddingService.search_vector(request)
    return {"matches": results_ids}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
