from fastapi import APIRouter, HTTPException, Form
from ..models.templates import SuggestionRequest, SuggestionResponse, TemplateMergeRequest, TemplateMergeResponse
from ..services.hub_service import HubService
from typing import Optional
import re

# Import LOCAL_TEMPLATES for debugging
from ..services.hub_service import LOCAL_TEMPLATES

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

@router.post("/templates/merge", response_model=TemplateMergeResponse, tags=["Templates"])
async def merge_template(
    user_prompt: str = Form(...),
    template_slug: str = Form(...),
    provider: str = Form("ollama"),
    model: str = Form("gemma:2b"),
    api_key: str = Form("")
):
    """
    Intelligently merge user prompt content into a selected template.
    """
    try:
        merged_template = hub_service.merge_template_with_prompt(
            user_prompt=user_prompt,
            template_slug=template_slug,
            provider=provider,
            model=model,
            api_key=api_key
        )
        return TemplateMergeResponse(merged_template=merged_template)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates/content/{template_slug}", tags=["Templates"])
async def get_template_content(template_slug: str):
    """
    Get the content and metadata of a specific template.
    """
    try:
        print(f"🚀 Template endpoint called for: {template_slug}")
        print(f"📋 Available LOCAL_TEMPLATES: {list(LOCAL_TEMPLATES.keys())}")
        print(f"🔍 Checking if '{template_slug}' is in LOCAL_TEMPLATES: {template_slug in LOCAL_TEMPLATES}")

        # Try direct access to LOCAL_TEMPLATES first for debugging
        if template_slug in LOCAL_TEMPLATES:
            print(f"✅ Found {template_slug} directly in LOCAL_TEMPLATES")
            content = LOCAL_TEMPLATES[template_slug]
            return {
                "content": content,
                "variables": list(set(re.findall(r'\{([^}]+)\}', content))),
                "slug": template_slug,
                "variable_count": len(set(re.findall(r'\{([^}]+)\}', content)))
            }
        else:
            print(f"❌ {template_slug} not found in LOCAL_TEMPLATES")

        template_info = hub_service.get_template_with_metadata(template_slug)
        print(f"✅ Template info retrieved: {template_info.get('content', '')[:100]}...")
        return template_info
    except Exception as e:
        print(f"❌ Error getting template {template_slug}: {e}")
        raise HTTPException(status_code=500, detail=str(e))