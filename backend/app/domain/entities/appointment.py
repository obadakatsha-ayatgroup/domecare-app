from typing import Optional, List
from datetime import datetime, date, time
from enum import Enum
from pydantic import BaseModel, Field, validator
from bson import ObjectId

class AppointmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"

class AppointmentType(str, Enum):
    CONSULTATION = "consultation"
    FOLLOW_UP = "follow_up"
    CHECK_UP = "check_up"
    EMERGENCY = "emergency"

class TimeSlot(BaseModel):
    """Time slot for appointment"""
    start_time: str  # Format: "09:00"
    end_time: str    # Format: "09:30"
    
    @validator('start_time', 'end_time')
    def validate_time_format(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
            return v
        except ValueError:
            raise ValueError("Time must be in HH:MM format")

class Appointment(BaseModel):
    """Appointment entity"""
    id: Optional[ObjectId] = Field(alias="_id", default=None)
    doctor_id: ObjectId
    patient_id: ObjectId
    appointment_date: date
    time_slot: TimeSlot
    status: AppointmentStatus = AppointmentStatus.PENDING
    appointment_type: AppointmentType = AppointmentType.CONSULTATION
    reason: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    
    # Additional Information
    consultation_fee: Optional[float] = None
    currency: str = "SYP"
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Cancellation
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[ObjectId] = None  # User who cancelled
    cancellation_reason: Optional[str] = None
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "doctor_id": "507f1f77bcf86cd799439011",
                "patient_id": "507f1f77bcf86cd799439012",
                "appointment_date": "2024-12-01",
                "time_slot": {
                    "start_time": "09:00",
                    "end_time": "09:30"
                },
                "appointment_type": "consultation",
                "reason": "Regular checkup"
            }
        }