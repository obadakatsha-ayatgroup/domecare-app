from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr, Field, validator  # Added validator
from app.core.config import settings
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    generate_otp,
    is_strong_password,
    decode_token  # Added decode_token
)
from app.core.exceptions import AuthenticationException, ValidationException, ConflictException
from app.services.auth_service import auth_service
from app.services.mock_services import MockVerificationService
from app.domain.entities.user import UserRole, AuthMethod

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Initialize services
# auth_service = AuthService()
verification_service = MockVerificationService()

# Request/Response Models
class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    country_code: str = "+963"
    password: str = Field(..., min_length=8)
    role: UserRole
    auth_method: Optional[AuthMethod] = None
    
    @validator('password')
    def validate_password_strength(cls, v):
        if not is_strong_password(v):
            raise ValueError("Password must contain uppercase, lowercase, and numbers")
        return v
    
    @validator('auth_method', always=True)
    def set_auth_method(cls, v, values):
        if v:
            return v
        # Auto-detect auth method based on provided credentials
        if settings.ALLOW_EMAIL_AUTH and values.get('email'):
            return AuthMethod.EMAIL
        elif settings.PHONE_VERIFICATION_ENABLED and values.get('phone_number'):
            return AuthMethod.PHONE
        else:
            return AuthMethod.EMAIL  # Default to email in dev mode

class VerifyOTPRequest(BaseModel):
    identifier: str  # Email or phone number
    otp: str = Field(..., min_length=6, max_length=6)

class LoginRequest(BaseModel):
    identifier: str  # Email or phone number
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class MessageResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

@router.post("/register", response_model=MessageResponse)
async def register(request: RegisterRequest):
    """
    Register a new user
    
    In development mode:
    - Email authentication is used
    - OTP is automatically set to "123456"
    - Phone verification structure is ready but disabled
    """
    try:
        # Check if user already exists
        existing_user = await auth_service.find_user_by_identifier(
            request.email if request.auth_method == AuthMethod.EMAIL else request.phone_number
        )
        
        if existing_user:
            raise ConflictException("User already exists with this email/phone")
        
        # Create user
        user_data = {
            "full_name": request.full_name,
            "email": request.email,
            "phone_number": request.phone_number,
            "country_code": request.country_code,
            "password_hash": get_password_hash(request.password),
            "role": request.role,
            "auth_method": request.auth_method,
            "status": "pending"
        }
        
        # In dev mode with email auth, auto-verify email
        if settings.USE_MOCK_SERVICES and request.auth_method == AuthMethod.EMAIL:
            user_data["is_email_verified"] = True
            user_data["status"] = "active"
        
        user = await auth_service.create_user(user_data)
        
        # Send verification code
        if request.auth_method == AuthMethod.EMAIL and not settings.USE_MOCK_SERVICES:
            identifier = request.email
        else:
            identifier = f"{request.country_code}{request.phone_number}"
        
        # Generate and send OTP
        otp = generate_otp()
        await verification_service.send_otp(identifier, request.auth_method)
        
        # Store OTP for verification
        await auth_service.store_otp(str(user["_id"]), otp)
        
        return MessageResponse(
            success=True,
            message=f"Registration successful. {'OTP: 123456 (Dev Mode)' if settings.USE_MOCK_SERVICES else 'Please check your email/phone for OTP'}",
            data={
                "user_id": str(user["_id"]),
                "auth_method": request.auth_method,
                "requires_verification": not settings.USE_MOCK_SERVICES or request.auth_method == AuthMethod.PHONE
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify", response_model=MessageResponse)
async def verify_otp(request: VerifyOTPRequest):
    """
    Verify OTP code
    
    In development mode:
    - Accepts "123456" as valid OTP
    - Auto-approves any 6-digit code
    """
    try:
        # In mock mode, always verify successfully
        if settings.USE_MOCK_SERVICES:
            is_valid = await verification_service.verify_otp(request.identifier, request.otp)
        else:
            is_valid = await auth_service.verify_otp(request.identifier, request.otp)
        
        if not is_valid:
            raise AuthenticationException("Invalid or expired OTP")
        
        # Update user verification status
        user = await auth_service.find_user_by_identifier(request.identifier)
        if user:
            update_data = {}
            if "@" in request.identifier:
                update_data["is_email_verified"] = True
            else:
                update_data["is_phone_verified"] = True
            
            update_data["status"] = "active"
            await auth_service.update_user(str(user["_id"]), update_data)
        
        return MessageResponse(
            success=True,
            message="Verification successful",
            data={"verified": True}
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Login with email/phone and password
    
    In development mode:
    - Email login is primary
    - Phone login structure ready but can be disabled
    """
    try:
        # Find user by email or phone
        user = await auth_service.find_user_by_identifier(request.identifier)
        
        if not user:
            raise AuthenticationException("Invalid credentials")
        
        # Verify password
        if not verify_password(request.password, user["password_hash"]):
            raise AuthenticationException("Invalid credentials")
        
        # Check if user can login
        if user["status"] != "active":
            raise AuthenticationException(f"Account is {user['status']}")
        
        # Check verification based on auth method
        if user["auth_method"] == AuthMethod.EMAIL and not user.get("is_email_verified"):
            raise AuthenticationException("Email not verified")
        elif user["auth_method"] == AuthMethod.PHONE and not user.get("is_phone_verified"):
            raise AuthenticationException("Phone not verified")
        
        # Update last login
        await auth_service.update_user(str(user["_id"]), {"last_login": datetime.utcnow()})
        
        # Create tokens
        token_data = {"sub": str(user["_id"]), "role": user["role"]}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Prepare user response (remove sensitive data)
        user_response = {
            "id": str(user["_id"]),
            "full_name": user["full_name"],
            "email": user.get("email"),
            "phone_number": user.get("phone_number"),
            "role": user["role"],
            "profile_completed": user.get("profile_completed", False)
        }
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str = Body(...)):
    """Refresh access token using refresh token"""
    try:
        # Decode refresh token
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise AuthenticationException("Invalid refresh token")
        
        # Get user
        user_id = payload.get("sub")
        user = await auth_service.get_user_by_id(user_id)
        
        if not user:
            raise AuthenticationException("User not found")
        
        # Create new tokens
        token_data = {"sub": str(user["_id"]), "role": user["role"]}
        access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        
        # Prepare user response
        user_response = {
            "id": str(user["_id"]),
            "full_name": user["full_name"],
            "email": user.get("email"),
            "phone_number": user.get("phone_number"),
            "role": user["role"],
            "profile_completed": user.get("profile_completed", False)
        }
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user_response
        )
        
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/method", response_model=MessageResponse)
async def get_auth_methods():
    """Get available authentication methods based on feature flags"""
    methods = []
    
    if settings.ALLOW_EMAIL_AUTH:
        methods.append("email")
    
    if settings.PHONE_VERIFICATION_ENABLED:
        methods.append("phone")
    
    return MessageResponse(
        success=True,
        message="Available authentication methods",
        data={
            "methods": methods,
            "primary": "email" if settings.ALLOW_EMAIL_AUTH else "phone",
            "mock_mode": settings.USE_MOCK_SERVICES,
            "features": {
                "phone_verification": settings.PHONE_VERIFICATION_ENABLED,
                "email_auth": settings.ALLOW_EMAIL_AUTH,
                "auto_approve_documents": settings.AUTO_APPROVE_DOCUMENTS
            }
        }
    )

@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(identifier: str = Body(...)):
    """
    Resend OTP code
    
    In development mode:
    - Always sends "123456"
    - No rate limiting
    """
    try:
        # Find user
        user = await auth_service.find_user_by_identifier(identifier)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate and send new OTP
        otp = generate_otp()
        await verification_service.send_otp(identifier, 
                                           AuthMethod.EMAIL if "@" in identifier else AuthMethod.PHONE)
        
        # Store new OTP
        await auth_service.store_otp(str(user["_id"]), otp)
        
        return MessageResponse(
            success=True,
            message=f"OTP resent successfully. {'OTP: 123456 (Dev Mode)' if settings.USE_MOCK_SERVICES else 'Please check your email/phone'}",
            data={"otp_sent": True}
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))