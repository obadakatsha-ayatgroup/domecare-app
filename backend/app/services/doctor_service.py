from typing import List, Optional, Dict, Any
from bson import ObjectId
from app.core.database import db
from app.core.exceptions import NotFoundException
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class DoctorService:
    """Service for doctor-related operations"""
    
    def __init__(self):
        self.users_collection = None
    
    async def init(self):
        """Initialize collections"""
        self.users_collection = db.get_collection("users")
    
    async def search_doctors(self, 
                           specialty: Optional[str] = None,
                           city: Optional[str] = None,
                           name: Optional[str] = None,
                           min_rating: Optional[float] = None,
                           max_fee: Optional[float] = None,
                           page: int = 1,
                           limit: int = 20) -> Dict[str, Any]:
        """Search for doctors with filters"""
        query = {
            "role": "doctor",
            "status": "active",
            "documents_verified": True  # Only verified doctors
        }
        
        # Name search (case insensitive)
        if name:
            query["full_name"] = {"$regex": name, "$options": "i"}
        
        # Specialty filter
        if specialty:
            query["specialties.main_specialty"] = {"$regex": specialty, "$options": "i"}
        
        # City filter
        if city:
            query["clinic_info.city"] = {"$regex": city, "$options": "i"}
        
        # Rating filter
        if min_rating:
            query["rating"] = {"$gte": min_rating}
        
        # Fee filter
        if max_fee:
            query["clinic_info.consultation_fee"] = {"$lte": max_fee}
        
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Get total count
        total = await self.users_collection.count_documents(query)
        
        # Get doctors with pagination
        doctors = await self.users_collection.find(
            query,
            {"password_hash": 0}  # Exclude sensitive data
        ).skip(skip).limit(limit).sort("rating", -1).to_list(None)
        
        # Convert ObjectId to string
        for doctor in doctors:
            doctor["_id"] = str(doctor["_id"])
        
        return {
            "doctors": doctors,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit,
            "limit": limit
        }
    
    async def get_doctor_by_id(self, doctor_id: str) -> Optional[Dict[str, Any]]:
        """Get doctor details by ID"""
        doctor = await self.users_collection.find_one(
            {
                "_id": ObjectId(doctor_id),
                "role": "doctor",
                "status": "active"
            },
            {"password_hash": 0}  # Exclude sensitive data
        )
        
        if doctor:
            doctor["_id"] = str(doctor["_id"])
        
        return doctor
    
    async def get_doctor_specialties(self) -> List[str]:
        """Get list of all available specialties"""
        pipeline = [
            {"$match": {"role": "doctor", "status": "active"}},
            {"$unwind": "$specialties"},
            {"$group": {"_id": "$specialties.main_specialty"}},
            {"$sort": {"_id": 1}}
        ]
        
        result = await self.users_collection.aggregate(pipeline).to_list(None)
        return [item["_id"] for item in result if item["_id"]]
    
    async def get_cities_with_doctors(self) -> List[str]:
        """Get list of cities with available doctors"""
        pipeline = [
            {"$match": {"role": "doctor", "status": "active", "clinic_info.city": {"$exists": True}}},
            {"$group": {"_id": "$clinic_info.city"}},
            {"$sort": {"_id": 1}}
        ]
        
        result = await self.users_collection.aggregate(pipeline).to_list(None)
        return [item["_id"] for item in result if item["_id"]]
    
    async def update_doctor_profile(self, doctor_id: str, update_data: Dict[str, Any]) -> bool:
        """Update doctor profile"""
        # Remove sensitive fields that shouldn't be updated this way
        update_data.pop("password_hash", None)
        update_data.pop("_id", None)
        update_data.pop("role", None)
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.users_collection.update_one(
            {"_id": ObjectId(doctor_id), "role": "doctor"},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    async def update_doctor_schedule(self, doctor_id: str, schedule_data: Dict[str, Any]) -> bool:
        """Update doctor's working schedule"""
        update_data = {
            "clinic_info.schedule": schedule_data,
            "updated_at": datetime.utcnow()
        }
        
        result = await self.users_collection.update_one(
            {"_id": ObjectId(doctor_id), "role": "doctor"},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    async def get_doctor_stats(self, doctor_id: str) -> Dict[str, Any]:
        """Get doctor statistics"""
        from datetime import datetime, timedelta
        
        # Get appointment counts
        appointments_collection = db.get_collection("appointments")
        prescriptions_collection = db.get_collection("prescriptions")
        
        # Today's appointments
        today = datetime.now().date()
        today_appointments = await appointments_collection.count_documents({
            "doctor_id": ObjectId(doctor_id),
            "appointment_date": today,
            "status": {"$ne": "cancelled"}
        })
        
        # This week's appointments
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        week_appointments = await appointments_collection.count_documents({
            "doctor_id": ObjectId(doctor_id),
            "appointment_date": {"$gte": week_start, "$lte": week_end},
            "status": {"$ne": "cancelled"}
        })
        
        # Total patients (unique)
        total_patients = len(await appointments_collection.distinct(
            "patient_id",
            {"doctor_id": ObjectId(doctor_id)}
        ))
        
        # Total appointments
        total_appointments = await appointments_collection.count_documents({
            "doctor_id": ObjectId(doctor_id)
        })
        
        # Total prescriptions
        total_prescriptions = await prescriptions_collection.count_documents({
            "doctor_id": ObjectId(doctor_id)
        })
        
        return {
            "today_appointments": today_appointments,
            "week_appointments": week_appointments,
            "total_patients": total_patients,
            "total_appointments": total_appointments,
            "total_prescriptions": total_prescriptions
        }

# Global service instance
doctor_service = DoctorService()