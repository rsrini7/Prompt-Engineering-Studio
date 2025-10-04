from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ..services.dspy_service import DspyService

router = APIRouter()
dspy_service = DspyService()

@router.post("/optimize", tags=["Optimization"])
async def optimize_prompt_endpoint(
    prompt: str = Form(...),
    dataset: UploadFile = File(...)
):
    """
    Optimizes a prompt using a provided dataset (CSV or JSONL).
    """
    try:
        file_content = await dataset.read()
        optimized_prompt = dspy_service.optimize_prompt(
            original_prompt=prompt,
            file_content=file_content,
            filename=dataset.filename
        )
        return {
            "original_prompt": prompt,
            "optimized_prompt": optimized_prompt
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))