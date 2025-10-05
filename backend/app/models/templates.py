from pydantic import BaseModel
from typing import List, Dict
from .analysis import PatternMatch # Re-use the PatternMatch model

class SuggestionRequest(BaseModel):
    patterns: Dict[str, PatternMatch]

class TemplateSuggestion(BaseModel):
    name: str # e.g., "hwchase17/react"
    score: float # The calculated match score (0-100)
    # We can add more metadata like a description later

class SuggestionResponse(BaseModel):
    suggestions: List[TemplateSuggestion]

class TemplateMergeRequest(BaseModel):
    user_prompt: str
    template_slug: str
    provider: str = "ollama"
    model: str = "gemma:2b"
    api_key: str = ""

class TemplateMergeResponse(BaseModel):
    merged_template: str