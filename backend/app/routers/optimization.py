from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ..services.dspy_service import DspyService
from typing import Optional

router = APIRouter()
dspy_service = DspyService()

@router.post("/optimize/estimate", tags=["Optimization"])
async def estimate_optimization_cost(
    dataset: UploadFile = File(...),
    provider: str = Form(...),
    model: str = Form(...),
    max_iterations: int = Form(4)
):
    """
    Estimate the cost of running prompt optimization before execution.
    """
    try:
        file_content = await dataset.read()
        estimation = dspy_service.estimate_optimization_cost(
            file_content=file_content,
            filename=dataset.filename,
            provider=provider,
            model=model,
            max_iterations=max_iterations
        )
        return estimation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize", tags=["Optimization"])
async def optimize_prompt_endpoint(
    prompt: str = Form(...),
    dataset: UploadFile = File(...),
    provider: str = Form(...), # e.g., "ollama", "openrouter", "groq"
    model: str = Form(...),      # e.g., "gemma:2b", "meta-llama/llama-3-8b-instruct"
    api_key: str = Form(None),
    metric: str = Form("exact_match"), # "exact_match" or "llm_as_a_judge"
    max_iterations: int = Form(4)      # Configurable guardrail for optimization iterations
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
            api_key=api_key,
            metric=metric,
            max_iterations=max_iterations
        )
        return {
            "original_prompt": prompt,
            "optimized_prompt": optimized_prompt
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))