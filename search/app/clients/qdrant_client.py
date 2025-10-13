from qdrant_client import QdrantClient
import uuid
from qdrant_client import models
from qdrant_client.models import PointStruct, Filter, FieldCondition
from search.app.dto.dtos import CreateEmbeddingDto, SearchPetDto
import numpy as np

QDRANT_COLLECTION = "pets_vectors"
client = QdrantClient(host="localhost", port=6333)

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