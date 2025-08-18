from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator

from app.core.config import settings
from app.core.database import db
from app.api.v1.endpoints.api import api_router
from app.core.exceptions import setup_exception_handlers
from app.services.auth_service import auth_service

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """Handle application lifecycle"""
    logger.info("Starting DOME Care Backend...")
    
    # Connect to MongoDB
    await db.connect()
    logger.info("Connected to MongoDB")

    await auth_service.init()
    
    # Show feature flags status
    logger.info(f"Feature Flags Status:")
    logger.info(f"  - Phone Verification: {'ENABLED' if settings.PHONE_VERIFICATION_ENABLED else 'DISABLED (Mock Mode)'}")
    logger.info(f"  - Document Verification: {'AUTO' if settings.AUTO_APPROVE_DOCUMENTS else 'MANUAL'}")
    logger.info(f"  - Email Auth: {'ENABLED' if settings.ALLOW_EMAIL_AUTH else 'DISABLED'}")
    logger.info(f"  - Mock Services: {'ACTIVE' if settings.USE_MOCK_SERVICES else 'INACTIVE'}")
    
    yield
    
    # Cleanup
    logger.info("Shutting down DOME Care Backend...")
    await db.disconnect()

app = FastAPI(
    title="DOME Care API",
    description="Healthcare Platform for Doctors and Patients in Syria",
    version="1.0.0",
    docs_url=settings.DOCS_URL if settings.SHOW_DOCS else None,
    redoc_url=settings.REDOC_URL if settings.SHOW_DOCS else None,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup exception handlers
setup_exception_handlers(app)

# Include routers
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "DOME Care Healthcare System API",
        "version": "1.0.0",
        "environment": settings.ENV,
        "features": {
            "phone_verification": settings.PHONE_VERIFICATION_ENABLED,
            "mock_mode": settings.USE_MOCK_SERVICES,
            "email_auth": settings.ALLOW_EMAIL_AUTH
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": await db.health_check(),
        "environment": settings.ENV
    }