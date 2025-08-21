from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from bson import ObjectId
from app.core.database import db
from app.domain.entities.prescription import Prescription, MedicineItem
from app.core.exceptions import NotFoundException, ValidationException
import random
import string
import logging

logger = logging.getLogger(__name__)

class PrescriptionService:
    """Service for managing prescriptions"""
    
    def __init__(self):
        self.prescriptions_collection = None
        self.users_collection = None
        self.medicines_collection = None
    
    async def init(self):
        """Initialize collections"""
        self.prescriptions_collection = db.get_collection("prescriptions")
        self.users_collection = db.get_collection("users")
        self.medicines_collection = db.get_collection("medicines")
    
    async def create_prescription(self, prescription_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new prescription"""
        # Validate doctor exists
        doctor = await self.users_collection.find_one({
            "_id": ObjectId(prescription_data["doctor_id"]),
            "role": "doctor",
            "status": "active"
        })
        if not doctor:
            raise NotFoundException("Doctor not found")
        
        # Validate patient exists
        patient = await self.users_collection.find_one({
            "_id": ObjectId(prescription_data["patient_id"]),
            "role": "patient",
            "status": "active"
        })
        if not patient:
            raise NotFoundException("Patient not found")
        
        # Generate prescription number
        prescription_number = await self._generate_prescription_number()
        
        # Prepare prescription data
        prescription_data["prescription_number"] = prescription_number
        prescription_data["created_at"] = datetime.utcnow()
        prescription_data["updated_at"] = datetime.utcnow()
        prescription_data["doctor_id"] = ObjectId(prescription_data["doctor_id"])
        prescription_data["patient_id"] = ObjectId(prescription_data["patient_id"])
        
        # Set valid until date (default 30 days)
        if not prescription_data.get("valid_until"):
            prescription_data["valid_until"] = date.today() + timedelta(days=30)
        
        # Convert appointment_id if provided
        if prescription_data.get("appointment_id"):
            prescription_data["appointment_id"] = ObjectId(prescription_data["appointment_id"])
        
        # Insert prescription
        result = await self.prescriptions_collection.insert_one(prescription_data)
        prescription_data["_id"] = result.inserted_id
        
        logger.info(f"Prescription created: {result.inserted_id}")
        return prescription_data
    
    async def get_prescriptions_by_doctor(self, doctor_id: str, 
                                        page: int = 1, 
                                        limit: int = 20) -> Dict[str, Any]:
        """Get prescriptions for a doctor"""
        skip = (page - 1) * limit
        
        query = {"doctor_id": ObjectId(doctor_id)}
        
        # Get total count
        total = await self.prescriptions_collection.count_documents(query)
        
        # Get prescriptions with pagination
        prescriptions = await self.prescriptions_collection.find(query)\
            .sort("created_at", -1)\
            .skip(skip)\
            .limit(limit)\
            .to_list(None)
        
        # Populate patient information
        for prescription in prescriptions:
            patient = await self.users_collection.find_one(
                {"_id": prescription["patient_id"]},
                {"password_hash": 0}
            )
            prescription["patient"] = patient
            prescription["_id"] = str(prescription["_id"])
            prescription["doctor_id"] = str(prescription["doctor_id"])
            prescription["patient_id"] = str(prescription["patient_id"])
            if prescription.get("appointment_id"):
                prescription["appointment_id"] = str(prescription["appointment_id"])
        
        return {
            "prescriptions": prescriptions,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit,
            "limit": limit
        }
    
    async def get_prescriptions_by_patient(self, patient_id: str,
                                         page: int = 1,
                                         limit: int = 20) -> Dict[str, Any]:
        """Get prescriptions for a patient"""
        skip = (page - 1) * limit
        
        query = {"patient_id": ObjectId(patient_id)}
        
        # Get total count
        total = await self.prescriptions_collection.count_documents(query)
        
        # Get prescriptions with pagination
        prescriptions = await self.prescriptions_collection.find(query)\
            .sort("created_at", -1)\
            .skip(skip)\
            .limit(limit)\
            .to_list(None)
        
        # Populate doctor information
        for prescription in prescriptions:
            doctor = await self.users_collection.find_one(
                {"_id": prescription["doctor_id"]},
                {"password_hash": 0}
            )
            prescription["doctor"] = doctor
            prescription["_id"] = str(prescription["_id"])
            prescription["doctor_id"] = str(prescription["doctor_id"])
            prescription["patient_id"] = str(prescription["patient_id"])
            if prescription.get("appointment_id"):
                prescription["appointment_id"] = str(prescription["appointment_id"])
        
        return {
            "prescriptions": prescriptions,
            "total": total,
            "page": page,
            "pages": (total + limit - 1) // limit,
            "limit": limit
        }
    
    async def get_prescription_by_id(self, prescription_id: str) -> Optional[Dict[str, Any]]:
        """Get prescription by ID with populated data"""
        prescription = await self.prescriptions_collection.find_one({"_id": ObjectId(prescription_id)})
        
        if not prescription:
            return None
        
        # Populate doctor and patient information
        doctor = await self.users_collection.find_one(
            {"_id": prescription["doctor_id"]},
            {"password_hash": 0}
        )
        patient = await self.users_collection.find_one(
            {"_id": prescription["patient_id"]},
            {"password_hash": 0}
        )
        
        prescription["doctor"] = doctor
        prescription["patient"] = patient
        prescription["_id"] = str(prescription["_id"])
        prescription["doctor_id"] = str(prescription["doctor_id"])
        prescription["patient_id"] = str(prescription["patient_id"])
        if prescription.get("appointment_id"):
            prescription["appointment_id"] = str(prescription["appointment_id"])
        
        return prescription
    
    async def update_prescription(self, prescription_id: str, update_data: Dict[str, Any]) -> bool:
        """Update prescription"""
        # Remove fields that shouldn't be updated
        update_data.pop("_id", None)
        update_data.pop("doctor_id", None)
        update_data.pop("patient_id", None)
        update_data.pop("prescription_number", None)
        update_data.pop("created_at", None)
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.prescriptions_collection.update_one(
            {"_id": ObjectId(prescription_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    async def search_medicines(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for medicines in the database"""
        search_query = {
            "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"name_ar": {"$regex": query, "$options": "i"}}
            ]
        }
        
        medicines = await self.medicines_collection.find(search_query)\
            .limit(limit)\
            .to_list(None)
        
        for medicine in medicines:
            medicine["_id"] = str(medicine["_id"])
        
        return medicines
    
    async def get_prescription_stats(self, doctor_id: str) -> Dict[str, Any]:
        """Get prescription statistics for a doctor"""
        # Today's prescriptions
        today = datetime.now().date()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        today_prescriptions = await self.prescriptions_collection.count_documents({
            "doctor_id": ObjectId(doctor_id),
            "created_at": {"$gte": today_start, "$lte": today_end}
        })
        
        # This week's prescriptions
        week_start = today - timedelta(days=today.weekday())
        week_start_dt = datetime.combine(week_start, datetime.min.time())
        week_end = week_start + timedelta(days=6)
        week_end_dt = datetime.combine(week_end, datetime.max.time())
        
        week_prescriptions = await self.prescriptions_collection.count_documents({
            "doctor_id": ObjectId(doctor_id),
            "created_at": {"$gte": week_start_dt, "$lte": week_end_dt}
        })
        
        # This month's prescriptions
        month_start = today.replace(day=1)
        month_start_dt = datetime.combine(month_start, datetime.min.time())
        
        month_prescriptions = await self.prescriptions_collection.count_documents({
            "doctor_id": ObjectId(doctor_id),
            "created_at": {"$gte": month_start_dt}
        })
        
        # Total prescriptions
        total_prescriptions = await self.prescriptions_collection.count_documents({
            "doctor_id": ObjectId(doctor_id)
        })
        
        return {
            "today": today_prescriptions,
            "week": week_prescriptions,
            "month": month_prescriptions,
            "total": total_prescriptions
        }
    
    async def _generate_prescription_number(self) -> str:
        """Generate unique prescription number"""
        while True:
            # Format: RX-YYYY-XXXXXX (RX-2024-123456)
            year = datetime.now().year
            random_part = ''.join(random.choices(string.digits, k=6))
            prescription_number = f"RX-{year}-{random_part}"
            
            # Check if already exists
            existing = await self.prescriptions_collection.find_one({
                "prescription_number": prescription_number
            })
            
            if not existing:
                return prescription_number

# Global service instance
prescription_service = PrescriptionService()