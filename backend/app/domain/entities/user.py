from typing import Optional, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, EmailStr, Field, validator
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class AuthMethod(str, Enum):
    EMAIL = "email"
    PHONE = "phone"
    BOTH = "both"

class UserRole(str, Enum):
    DOCTOR = "doctor"
    PATIENT = "patient"
    ADMIN = "admin"

class UserStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    BLOCKED = "blocked"
    DEACTIVATED = "deactivated"

class User(BaseModel):
    """Base User entity"""
    id: Optional[ObjectId] = Field(alias="_id", default=None)
    full_name: str = Field(..., min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    country_code: Optional[str] = "+963"  # Syria default
    auth_method: AuthMethod = AuthMethod.EMAIL
    password_hash: str
    role: UserRole
    status: UserStatus = UserStatus.PENDING
    is_email_verified: bool = False
    is_phone_verified: bool = False
    profile_completed: bool = False
    feature_flags: dict = Field(default_factory=lambda: {
        "phone_verification_required": False,
        "document_verification_required": False
    })
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "full_name": "Dr. Ahmad Hassan",
                "email": "ahmad@example.com",
                "role": "doctor",
                "auth_method": "email"
            }
        }
    
    @validator('phone_number')
    def validate_phone_number(cls, v, values):
        """Validate Syrian phone number format"""
        if v is None:
            return v
        
        # Remove any spaces or special characters
        cleaned = ''.join(filter(str.isdigit, v))
        
        # Syrian phone numbers: 9 digits starting with 9, or 10 digits starting with 0
        if len(cleaned) == 9 and cleaned[0] == '9':
            return cleaned
        elif len(cleaned) == 10 and cleaned[0] == '0':
            return cleaned
        else:
            raise ValueError("Invalid Syrian phone number format")
    
    def can_login(self) -> bool:
        """Check if user can login based on verification status"""
        if self.status != UserStatus.ACTIVE:
            return False
        
        if self.auth_method == AuthMethod.EMAIL:
            return self.is_email_verified
        elif self.auth_method == AuthMethod.PHONE:
            return self.is_phone_verified
        else:  # BOTH
            return self.is_email_verified or self.is_phone_verified
    
    def to_dict(self) -> dict:
        """Convert to dictionary for MongoDB"""
        data = self.dict(by_alias=True, exclude_unset=True)
        if data.get("_id"):
            data["_id"] = ObjectId(data["_id"])
        return data