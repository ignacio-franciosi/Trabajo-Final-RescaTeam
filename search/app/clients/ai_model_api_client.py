import httpx
from app.dto.dtos import EmbedRequest

class AiModelApiClient:
    def __init__(self, base_url: str, model_api_key: str, client: httpx.AsyncClient):
        self.base_url = base_url
        self.api_key = model_api_key
        self.client = client

    async def generate_embedding(self, image_url: str) -> list[float]:
        body = EmbedRequest(image_url=image_url)
        headers = {"X-API-KEY": self.api_key}
        
        response = await self.client.post(
            f"{self.base_url}/embed",
            json=body.model_dump(),
            headers=headers
        )
        response.raise_for_status()
        return response.json()["embedding"]