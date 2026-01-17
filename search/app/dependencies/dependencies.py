from fastapi import Request
from app.services.search_service import SearchService

def get_search_service(request: Request) -> SearchService:
    return SearchService(request.app.state.ai_client)
