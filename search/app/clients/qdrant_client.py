from qdrant_client import QdrantClient
import uuid
from qdrant_client import models
from qdrant_client.models import PointStruct, Filter, FieldCondition
from app.dto.dtos import CreateEmbeddingDto, SearchPetDto
import numpy as np
from config.settings import QDRANT_URL, QDRANT_API_KEY, QDRANT_COLLECTION

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
print(client.get_collections())

def init_qdrant_collection():
    collections = [c.name for c in client.get_collections().collections]
    if QDRANT_COLLECTION not in collections:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=models.VectorParams(size=2048, distance=models.Distance.COSINE),
        )
        print(f"Colección creada: {QDRANT_COLLECTION}")
    else:
        print(f"Conectado a colección existente: {QDRANT_COLLECTION}")


def save_embedding(request: CreateEmbeddingDto, vector: np.ndarray):
    qdrant_id = str(uuid.uuid4())
    client.upsert(
        collection_name=QDRANT_COLLECTION,
        points=[
            models.PointStruct(
                id=qdrant_id,
                vector=vector.tolist(),
                payload={
                    "post_id": request.post_id,
                    "post_type": request.post_type
                }
            )
        ]
    )
    # verificar si se creo, devolver id sino error
    return qdrant_id

def get_embedding_by_post_id(post_id: str):
    hits = client.scroll(
        collection_name=QDRANT_COLLECTION,
        filter=Filter(
            must=[
                FieldCondition(key="post_id", match=post_id)
            ]
        ),
        limit=1
    )
    if not hits.points:
        return None
    return np.array(hits.points[0].vector)

def search_embedding(request: SearchPetDto):
    vector = get_embedding_by_post_id(request.post_id)
    if vector is None:
        return []
    
    opposite_type = "Found" if request.post_type == "Lost" else "Lost"
    
    # Filtrar por payload
    filter = Filter(
        must=[
            FieldCondition(
                key="post_type",
                match=opposite_type
            )
        ]
    )

    results = client.search(
        collection_name=QDRANT_COLLECTION,
        query_vector=vector.tolist(),
        limit=1000,
        score_threshold=0.3, # max distance
        filter=filter
    )
    return results