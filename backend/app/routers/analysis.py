from fastapi import APIRouter, HTTPException
from ..models.analysis import AnalyzeRequest, AnalyzeResponse
from ..services.pattern_detector import AdvancedPromptPatternDetector

router = APIRouter()
detector = AdvancedPromptPatternDetector() # Create an instance of the detector

@router.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze_prompt(request: AnalyzeRequest):
    """
    Analyzes the user's prompt to detect prompt engineering patterns.
    """
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    try:
        # Use the detector instance to find patterns
        detected_patterns = detector.detect_patterns(request.prompt)
        
        # Here you would add the optional LLM refiner logic later
        if request.use_llm_refiner:
            # Placeholder for future logic
            pass
            
        return AnalyzeResponse(patterns=detected_patterns)
    except Exception as e:
        # Basic error handling
        raise HTTPException(status_code=500, detail=str(e))