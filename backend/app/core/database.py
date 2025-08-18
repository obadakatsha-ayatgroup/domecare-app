from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    """MongoDB connection manager"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database = None
    
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.database = self.client[settings.MONGODB_DATABASE]
            
            # Verify connection
            await self.client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
            
            # Create indexes
            await self._create_indexes()
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def health_check(self) -> bool:
        """Check database health"""
        try:
            if self.client:
                await self.client.admin.command('ping')
                return True
        except:
            pass
        return False
    
    async def _create_indexes(self):
        """Create database indexes"""
        # Users collection indexes
        users_collection = self.database.users
        await users_collection.create_index("email", unique=True, sparse=True)
        await users_collection.create_index("phone_number", sparse=True)
        await users_collection.create_index([("phone_number", 1), ("country_code", 1)], sparse=True)
        
        # Verification tokens collection with TTL
        tokens_collection = self.database.verification_tokens
        await tokens_collection.create_index("expires_at", expireAfterSeconds=0)
        await tokens_collection.create_index("user_id")
        await tokens_collection.create_index("token")
        
        # Appointments collection indexes
        appointments_collection = self.database.appointments
        await appointments_collection.create_index("doctor_id")
        await appointments_collection.create_index("patient_id")
        await appointments_collection.create_index("appointment_date")
        await appointments_collection.create_index("status")
        
        logger.info("Database indexes created successfully")
    
    def get_collection(self, name: str):
        """Get a collection from the database"""
        if self.database is None:
            raise Exception("Database not connected")
        return self.database[name]

# Global database instance
db = MongoDB()