from typing import Optional, List, Dict
from datetime import datetime, time
from pydantic import BaseModel, Field
from app.domain.entities.user import User, UserRole
from enum import Enum

class DayOfWeek(str, Enum):
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"

class SessionDuration(int, Enum):
    FIFTEEN = 15
    THIRTY = 30
    SIXTY = 60

class TimeSlot(BaseModel):
    """Time slot for appointments"""
    start_time: str  # Format: "09:00"
    end_time: str    # Format: "17:00"
    
    @validator('start_time', 'end_time')
    def validate_time_format(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError("Time must be in HH:MM format")

class DaySchedule(BaseModel):
    """Schedule for a specific day"""
    is_working: bool = False
    time_slots: List[TimeSlot] = []

class ClinicInfo(BaseModel):
    """Clinic information"""
    # Schedule
    session_duration: SessionDuration = SessionDuration.THIRTY
    schedule: Dict[DayOfWeek, DaySchedule] = Field(default_factory=dict)
    
    # Address
    city: Optional[str] = None
    area: Optional[str] = None
    detailed_address: Optional[str] = None
    
    # Contact
    clinic_phone: Optional[str] = None
    clinic_email: Optional[str] = None
    website: Optional[str] = None
    
    # Pricing
    consultation_fee: Optional[float] = None
    currency: str = "SYP"

class Specialty(BaseModel):
    """Doctor specialty"""
    main_specialty: str
    sub_specialty: Optional[str] = None
    certificate_url: Optional[str] = None
    verification_status: str = "pending"  # pending, verified, rejected
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

class Certificate(BaseModel):
    """Professional certificate"""
    name: str
    issuing_authority: str
    issue_date: datetime
    certificate_number: Optional[str] = None
    file_url: Optional[str] = None
    description: Optional[str] = None

class Doctor(User):
    """Doctor entity extending User"""
    role: UserRole = UserRole.DOCTOR
    
    # Professional Information
    specialties: List[Specialty] = []
    certificates: List[Certificate] = []
    bio: Optional[str] = Field(None, max_length=500)
    years_of_experience: Optional[int] = None
    
    # Clinic Information
    clinic_info: Optional[ClinicInfo] = None
    
    # Statistics
    total_patients: int = 0
    total_appointments: int = 0
    rating: Optional[float] = None
    reviews_count: int = 0
    
    # Document Verification (auto-approved in dev mode)
    documents_verified: bool = False
    documents_submitted_at: Optional[datetime] = None
    
    class Config:
        schema_extra = {
            "example": {
                "full_name": "Dr. Ahmad Hassan",
                "email": "dr.ahmad@example.com",
                "role": "doctor",
                "specialties": [{
                    "main_specialty": "General Medicine",
                    "sub_specialty": "Internal Medicine"
                }],
                "years_of_experience": 10
            }
        }
    
    def is_available_for_appointments(self) -> bool:
        """Check if doctor is available for appointments"""
        return (
            self.status == "active" and
            self.profile_completed and
            self.documents_verified and
            self.clinic_info is not None
        )