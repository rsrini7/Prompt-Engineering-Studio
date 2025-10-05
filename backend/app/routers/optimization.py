from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ..services.dspy_service import DspyService

router = APIRouter()
dspy_service = DspyService()

@router.post("/optimize", tags=["Optimization"])
async def optimize_prompt_endpoint(
    prompt: str = Form(...),
    dataset: UploadFile = File(...),
    provider: str = Form(...), # e.g., "ollama", "openrouter", "groq"
    model: str = Form(...),      # e.g., "gemma:2b", "meta-llama/llama-3-8b-instruct"
    api_key: str = Form(None)
):
    """
    Optimizes a prompt using a provided dataset (CSV or JSONL).
    """
    try:
        file_content = await dataset.read()
        optimized_prompt = dspy_service.optimize_prompt(
            original_prompt=prompt,
            file_content=file_content,
            filename=dataset.filename,
            provider=provider,
            model=model,
            api_key=api_key
        )
        return {
            "original_prompt": prompt,
            "optimized_prompt": optimized_prompt
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))