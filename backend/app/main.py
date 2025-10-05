from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables from .env.local file
# Use absolute path to ensure correct loading regardless of working directory
current_dir = Path(__file__).parent
project_root = current_dir.parent.parent
env_file = project_root / '.env.local'

if env_file.exists():
    load_dotenv(env_file)
    print(f"Loaded environment variables from: {env_file}")
else:
    print(f"Warning: .env.local file not found at {env_file}")

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware # Import the CORS middleware
try:
    from .routers.analysis import router as analysis_router
    print(f"✅ Analysis router imported")
except Exception as e:
    print(f"❌ Failed to import analysis router: {e}")

try:
    from .routers.templates import router as templates_router
    print(f"✅ Templates router imported")
except Exception as e:
    print(f"❌ Failed to import templates router: {e}")

try:
    from .routers.optimization import router as optimization_router
    print(f"✅ Optimization router imported")
except Exception as e:
    print(f"❌ Failed to import optimization router: {e}")

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

app.include_router(analysis_router, prefix="/api")
app.include_router(templates_router, prefix="/api")
app.include_router(optimization_router, prefix="/api")

print("All routers registered successfully")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Check if the API is running."""
    return {"status": "ok"}