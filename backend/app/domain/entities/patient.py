from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field
from app.domain.entities.user import User, UserRole
from enum import Enum

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class BloodType(str, Enum):
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"

class MedicalHistory(BaseModel):
    """Patient medical history"""
    chronic_diseases: List[str] = []
    allergies: List[str] = []
    current_medications: List[str] = []
    previous_surgeries: List[str] = []
    family_history: List[str] = []
    notes: Optional[str] = None

class EmergencyContact(BaseModel):
    """Emergency contact information"""
    name: str
    relationship: str
    phone_number: str
    alternative_phone: Optional[str] = None

class Patient(User):
    """Patient entity extending User"""
    role: UserRole = UserRole.PATIENT
    
    # Personal Information
    date_of_birth: Optional[date] = None
    gender: Optional[Gender] = None
    blood_type: Optional[BloodType] = None
    
    # Medical Information
    medical_history: Optional[MedicalHistory] = None
    emergency_contact: Optional[EmergencyContact] = None
    
    # Healthcare Preferences
    preferred_language: str = "ar"  # Arabic default
    
    # Statistics
    total_appointments: int = 0
    total_prescriptions: int = 0
    last_visit: Optional[datetime] = None
    
    class Config:
        schema_extra = {
            "example": {
                "full_name": "Sara Ahmed",
                "email": "sara@example.com",
                "role": "patient",
                "gender": "female",
                "blood_type": "A+",
                "date_of_birth": "1990-01-01"
            }
        }
    
    @property
    def age(self) -> Optional[int]:
        """Calculate patient age"""
        if self.date_of_birth:
            today = date.today()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None