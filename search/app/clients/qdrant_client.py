import numpy as np
from qdrant_client import QdrantClient
import uuid
from qdrant_client import models
from qdrant_client.models import Filter, FieldCondition, MatchValue
from app.dto.dtos import CreateEmbeddingDto, SearchPetDto
from app.config.settings import QDRANT_URL, QDRANT_API_KEY, QDRANT_COLLECTION

client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

def init_qdrant_collection():
    collections = [c.name for c in client.get_collections().collections]
    if QDRANT_COLLECTION not in collections:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=models.VectorParams(size=2048, distance=models.Distance.COSINE),
        )
        print(f"Colección creada: {QDRANT_COLLECTION}")
    else:
        print(f"Conectado a colección: {QDRANT_COLLECTION}")

    try:
        client.create_payload_index(
            collection_name=QDRANT_COLLECTION,
            field_name="post_id",
            field_schema=models.PayloadSchemaType.KEYWORD,
        )
        print("Índice creado para campo post_id")
    except Exception as e:
        print(f"El índice de post_id ya existe: {e}")

    try:
        client.create_payload_index(
            collection_name=QDRANT_COLLECTION,
            field_name="post_type",
            field_schema=models.PayloadSchemaType.KEYWORD,
        )
        print("Índice creado para campo post_type")
    except Exception as e:
        print(f"El índice de post_type ya existe: {e}")

    try:
        client.create_payload_index(
            collection_name=QDRANT_COLLECTION,
            field_name="species",
            field_schema=models.PayloadSchemaType.KEYWORD,
        )
        print("Índice creado para campo species")
    except Exception as e:
        print(f"El índice de species ya existe: {e}")


def save_embedding(request: CreateEmbeddingDto, vector: np.ndarray):
    qdrant_id = str(uuid.uuid4())
    #print("vector.tolist(): ", vector.tolist())
    #print(type(vector), vector.shape, vector[:5])
    client.upsert(
        collection_name=QDRANT_COLLECTION,
        points=[
            models.PointStruct(
                id=qdrant_id,
                vector=vector.tolist(),
                payload={
                    "post_id": request.post_id,
                    "post_type": request.post_type,
                    "species": request.species
                }
            )
        ]
    )
    # verificar si se creo, devolver id sino error
    return qdrant_id

def get_embedding_by_post_id(post_id: str):
    points, _ = client.scroll(
        collection_name=QDRANT_COLLECTION,
        scroll_filter=Filter(
            must=[
                FieldCondition(key="post_id", match=MatchValue(value=post_id))
            ]
        ),
        limit=1,
        with_vectors=True
    )
    #print("points:", points)
    if not points:
        return None
    return np.array(points[0].vector)

def search_embedding(request: SearchPetDto):
    vector = get_embedding_by_post_id(request.post_id)
    #print("vector:", vector)
    #print("norma ", np.linalg.norm(vector))
    if vector is None:
        return []
    
    opposite_type = "found" if request.post_type == "lost" else "lost"
    
    # Filtrar por payload
    q_filter = Filter(
        must=[
            FieldCondition(
                key="post_type",
                match=MatchValue(value=opposite_type)
            ),
            FieldCondition(
                key="species",
                match=MatchValue(value=request.species)
            )
        ]
    )

    results = client.search(
        collection_name=QDRANT_COLLECTION,
        query_vector=vector.tolist(),
        limit=1000,
        score_threshold=0.45,  # max distance
        query_filter=q_filter
    )
    for r in results:
        print(r.score, r.payload)
    return results