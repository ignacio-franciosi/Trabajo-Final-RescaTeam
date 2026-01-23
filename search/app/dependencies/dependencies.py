from fastapi import Request
from app.services.search_service import SearchService

def get_search_service(request: Request) -> SearchService:
    return SearchService(
        ai_client=request.app.state.ai_client,
        vector_repo=request.app.state.vector_repo,
        image_repo=request.app.state.image_repo
    )