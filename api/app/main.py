import os
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="techrepubl1k.com API",
    description="Backend API for techrepubl1k.com personal tech education platform",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://techrepubl1k.com",
    "https://joshlorilla.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api/v1")

@api_router.get("/health", tags=["System"])
def health_check():
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "environment": os.getenv("ENV", "development")
        },
        "meta": {},
        "error": None
    }

app.include_router(api_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to techrepubl1k.com API. Visit /docs for Swagger UI documentation."}
