from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

logger = logging.getLogger(__name__)

class DomeCareException(Exception):
    """Base exception for DOME Care application"""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class AuthenticationException(DomeCareException):
    """Authentication related exceptions"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)

class AuthorizationException(DomeCareException):
    """Authorization related exceptions"""
    def __init__(self, message: str = "Not authorized"):
        super().__init__(message, status_code=403)

class ValidationException(DomeCareException):
    """Validation related exceptions"""
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, status_code=422)

class NotFoundException(DomeCareException):
    """Resource not found exceptions"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)

class ConflictException(DomeCareException):
    """Conflict exceptions (e.g., duplicate resources)"""
    def __init__(self, message: str = "Resource conflict"):
        super().__init__(message, status_code=409)

def setup_exception_handlers(app: FastAPI):
    """Setup global exception handlers"""
    
    @app.exception_handler(DomeCareException)
    async def domecare_exception_handler(request: Request, exc: DomeCareException):
        logger.error(f"DomeCare exception: {exc.message}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.message,
                "error_type": exc.__class__.__name__
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Validation error: {exc.errors()}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "message": "Validation failed",
                "errors": exc.errors()
            }
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.error(f"HTTP exception: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.detail
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": "Internal server error" if not app.debug else str(exc)
            }
        )