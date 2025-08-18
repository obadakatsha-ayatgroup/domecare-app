from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
from app.core.database import db
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class AuthService:
    """Authentication service"""
    
    def __init__(self):
        self.users_collection = None
    
    async def init(self):
        self.users_collection = db.get_collection("users")
        self.tokens_collection = db.get_collection("verification_tokens")
    
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new user"""
        user_data["created_at"] = datetime.utcnow()
        user_data["updated_at"] = datetime.utcnow()
        
        # Set feature flags based on environment
        user_data["feature_flags"] = {
            "phone_verification_required": settings.PHONE_VERIFICATION_ENABLED,
            "document_verification_required": not settings.AUTO_APPROVE_DOCUMENTS
        }
        
        result = await self.users_collection.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        return user_data
    
    async def find_user_by_identifier(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Find user by email or phone number"""
        if "@" in identifier:
            # Email lookup
            return await self.users_collection.find_one({"email": identifier})
        else:
            # Phone lookup
            return await self.users_collection.find_one({"phone_number": identifier})
    
    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            return await self.users_collection.find_one({"_id": ObjectId(user_id)})
        except:
            return None
    
    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """Update user data"""
        update_data["updated_at"] = datetime.utcnow()
        result = await self.users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    async def store_otp(self, user_id: str, otp: str) -> None:
        """Store OTP for verification"""
        await self.tokens_collection.insert_one({
            "user_id": ObjectId(user_id),
            "token": otp,
            "type": "otp",
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES),
            "attempts": 0
        })
    
    async def verify_otp(self, identifier: str, otp: str) -> bool:
        """Verify OTP (real implementation)"""
        # Find user first
        user = await self.find_user_by_identifier(identifier)
        if not user:
            return False
        
        # Find valid OTP token
        token = await self.tokens_collection.find_one({
            "user_id": user["_id"],
            "token": otp,
            "type": "otp",
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not token:
            return False
        
        # Mark token as used
        await self.tokens_collection.update_one(
            {"_id": token["_id"]},
            {"$set": {"used_at": datetime.utcnow()}}
        )
        
        return True
    
auth_service = AuthService()