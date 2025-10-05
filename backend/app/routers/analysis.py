from fastapi import APIRouter, HTTPException, Form
from ..models.analysis import AnalyzeRequest, AnalyzeResponse
from ..services.pattern_detector import AdvancedPromptPatternDetector
from typing import Optional

router = APIRouter()
detector = AdvancedPromptPatternDetector() # Create an instance of the detector

@router.post("/analyze", response_model=AnalyzeResponse, tags=["Analysis"])
async def analyze_prompt(
    prompt: str = Form(...),
    use_llm_refiner: bool = Form(False),
    llm_provider: str = Form("ollama"),
    llm_model: str = Form("gemma:2b"),
    llm_api_key: Optional[str] = Form(None)
):
    """
    Analyzes the user's prompt to detect prompt engineering patterns.
    Optionally uses LLM refinement for improved accuracy.
    """
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

    try:
        # Step 1: Rule-based pattern detection
        detected_patterns = detector.detect_patterns(prompt)

        # Step 2: Optional LLM refinement
        if use_llm_refiner:
            refined_patterns = detector.refine_patterns_with_llm(
                original_prompt=prompt,
                detected_patterns=detected_patterns,
                provider=llm_provider,
                model=llm_model,
                api_key=llm_api_key
            )
            return AnalyzeResponse(patterns=refined_patterns)
        else:
            return AnalyzeResponse(patterns=detected_patterns)

    except Exception as e:
        # Basic error handling
        raise HTTPException(status_code=500, detail=str(e))