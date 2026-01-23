import numpy as np
import uuid
from qdrant_client import QdrantClient
from qdrant_client import models
from qdrant_client.models import Filter, FieldCondition, MatchValue
from app.dto.dtos import CreateEmbeddingDto, SearchPetDto
from app.settings.settings import QDRANT_COLLECTION

def init_qdrant_collection(client: QdrantClient):
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


class VectorRepository:
    def __init__(self, client: QdrantClient, collection: str):
        self.client = client
        self.collection = collection

    def save_embedding(self, request: CreateEmbeddingDto, vector: np.ndarray):
        qdrant_id = str(uuid.uuid4())
        #print("vector.tolist(): ", vector.tolist())
        #print(type(vector), vector.shape, vector[:5])
        self.client.upsert(
            collection_name=self.collection,
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

    def get_embedding_by_post_id(self, post_id: str):
        points, _ = self.client.scroll(
            collection_name=self.collection,
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

    def search_embedding(self, request: SearchPetDto):
        vector = self.get_embedding_by_post_id(request.post_id)
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

        results = self.client.search(
            collection_name=self.collection,
            query_vector=vector.tolist(),
            limit=1000,
            score_threshold=0.45,  # max distance
            query_filter=q_filter
        )
        for r in results:
            print(r.score, r.payload)
        return results