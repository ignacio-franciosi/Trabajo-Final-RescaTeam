from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import httpx
import logging
from contextlib import asynccontextmanager
from app.services.search_service import SearchService
from app.dto.dtos import CreateEmbeddingDto, SearchPetDto
from app.clients.qdrant_client import init_qdrant_collection
from app.clients.rabbit_consumer import start_consumer
from app.dependencies.dependencies import get_search_service
from app.config.settings import FRONTEND_BASE_URL, MODEL_API_BASE_URL, MODEL_API_KEY
from app.clients.ai_model_api_client import AiModelApiClient

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_qdrant_collection()

    http_client = httpx.AsyncClient(timeout=30)
    ai_client = AiModelApiClient(
        base_url=MODEL_API_BASE_URL,
        model_api_key=MODEL_API_KEY,
        client=http_client
    )

    consumer_task = asyncio.create_task(start_consumer())
    
    app.state.ai_client = ai_client
    app.state.consumer_task = consumer_task

    yield

    # shutdown
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass

    await http_client.aclose()


app = FastAPI(
    title = "RescaTeam search API",
    description = "API to search similar pets",
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
async def create_vector(
    request: CreateEmbeddingDto,
    search_service: SearchService = Depends(get_search_service)
):
    qdrant_id = await search_service.create_vector(request)
    logging.info(f"Vector creado en Qdrant con id={qdrant_id}")
    return {"status": "success", "qdrant_id": qdrant_id}

@app.get("/vectors/search")
def search(
    request: SearchPetDto = Depends(),
    search_service: SearchService = Depends(get_search_service)
):
    results_ids = search_service.search_vector(request)
    return {"matches": results_ids}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
