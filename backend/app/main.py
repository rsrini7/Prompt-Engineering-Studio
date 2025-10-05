from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware # Import the CORS middleware
from .routers.analysis import router as analysis_router
from .routers.templates import router as templates_router
from .routers.optimization import router as optimization_router

app = FastAPI(
    title="Prompt Engineering Studio API",
    description="API for analyzing and optimizing LLM prompts.",
    version="0.1.0",
)

# Define the list of origins that are allowed to make requests.
# For development, this is your frontend's address.
origins = [
    "http://localhost:5173",
]

# Add the CORS middleware to your application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (GET, POST, etc.)
    allow_headers=["*"], # Allow all headers
)

# Include the routers with a prefix
app.include_router(analysis_router, prefix="/api")
app.include_router(templates_router, prefix="/api")
app.include_router(optimization_router, prefix="/api")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Check if the API is running."""
    return {"status": "ok"}