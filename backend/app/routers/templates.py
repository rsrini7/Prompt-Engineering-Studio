from fastapi import APIRouter, HTTPException
from ..models.templates import SuggestionRequest, SuggestionResponse
from ..services.hub_service import HubService

router = APIRouter()
hub_service = HubService()

@router.post("/templates/suggest", response_model=SuggestionResponse, tags=["Templates"])
async def suggest_templates(request: SuggestionRequest):
    """
    Suggests LangChain Hub templates based on detected prompt patterns.
    """
    try:
        suggestions = hub_service.get_suggestions(request.patterns)
        return SuggestionResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))