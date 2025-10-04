from pydantic import BaseModel
from typing import List, Dict

class AnalyzeRequest(BaseModel):
    """Request model for analyzing a prompt."""
    prompt: str
    # This flag will be used later for the LLM-as-Refiner feature
    use_llm_refiner: bool = False

class PatternMatch(BaseModel):
    """Response model for a single detected pattern."""
    pattern: str
    confidence: float
    evidence: List[str]
    description: str
    category: str

class AnalyzeResponse(BaseModel):
    """Response model containing all detected patterns."""
    patterns: Dict[str, PatternMatch]
    