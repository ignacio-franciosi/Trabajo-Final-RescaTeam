from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import logging
from qdrant_client import QdrantClient
from contextlib import asynccontextmanager
import boto3
from app.services.search_service import SearchService
from app.dto.dtos import CreateEmbeddingDto, SearchPetDto
from app.clients.rabbit_consumer import start_consumer
from app.dependencies.dependencies import get_search_service
from app.settings.settings import FRONTEND_BASE_URL, QDRANT_URL, QDRANT_API_KEY, QDRANT_COLLECTION, AWS_S3_BUCKET_NAME
from app.clients.ai_model_client import AIModelClient
from app.repositories.image_repository import ImageRepository
from app.repositories.vector_repository import VectorRepository
from app.repositories.vector_repository import init_qdrant_collection
from app.utils.model_loader import ensure_model_downloaded

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Image client and repository
    s3_client = boto3.client("s3")
    app.state.image_repo = ImageRepository(
        s3_client=s3_client,
        bucket_name=AWS_S3_BUCKET_NAME
    )

    # Vector client and repository
    qdrant_client = QdrantClient(
        url=QDRANT_URL,
        api_key=QDRANT_API_KEY,
    )
    init_qdrant_collection(qdrant_client)
    app.state.vector_repo = VectorRepository(
        client=qdrant_client,
        collection=QDRANT_COLLECTION
    )
    model_path = "ai_model/best_resnet50.pth"
    ensure_model_downloaded(model_path)
    # AI model client
    app.state.ai_client = AIModelClient("ai_model/best_resnet50.pth")

    # RabbitMQ consumer
    consumer_task = asyncio.create_task(start_consumer())
    app.state.consumer_task = consumer_task

    yield

    # Shutdown
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass


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
async def search(
    request: SearchPetDto = Depends(),
    search_service: SearchService = Depends(get_search_service)
):
    results_ids = await search_service.search_vector(request)
    return {"matches": results_ids}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)
