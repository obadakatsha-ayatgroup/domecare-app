from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field
from bson import ObjectId

class MedicineItem(BaseModel):
    """Individual medicine in prescription"""
    name: str
    name_ar: Optional[str] = None
    dosage: str  # e.g., "500mg"
    frequency: str  # e.g., "Twice daily"
    duration: str  # e.g., "7 days"
    instructions: Optional[str] = None
    instructions_ar: Optional[str] = None

class Prescription(BaseModel):
    """Prescription entity"""
    id: Optional[ObjectId] = Field(alias="_id", default=None)
    doctor_id: ObjectId
    patient_id: ObjectId
    appointment_id: Optional[ObjectId] = None  # Link to appointment if created during visit
    
    # Medical Information
    diagnosis: Optional[str] = Field(None, max_length=1000)
    diagnosis_ar: Optional[str] = Field(None, max_length=1000)
    medicines: List[MedicineItem] = []
    general_instructions: Optional[str] = Field(None, max_length=1000)
    general_instructions_ar: Optional[str] = Field(None, max_length=1000)
    
    # Prescription Details
    prescription_number: str  # Auto-generated
    valid_until: Optional[date] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "doctor_id": "507f1f77bcf86cd799439011",
                "patient_id": "507f1f77bcf86cd799439012",
                "diagnosis": "Common cold",
                "medicines": [
                    {
                        "name": "Paracetamol",
                        "dosage": "500mg",
                        "frequency": "Three times daily",
                        "duration": "5 days",
                        "instructions": "Take after meals"
                    }
                ]
            }
        }