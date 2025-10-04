from fastapi import FastAPI
from fastapi.responses import RedirectResponse
# Import the new router
from .routers import analysis

app = FastAPI(
    title="Prompt Engineering Studio API",
    description="API for analyzing and optimizing LLM prompts.",
    version="0.1.0",
)

# Include the analysis router with a prefix
app.include_router(analysis.router, prefix="/api")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Check if the API is running."""
    return {"status": "ok"}