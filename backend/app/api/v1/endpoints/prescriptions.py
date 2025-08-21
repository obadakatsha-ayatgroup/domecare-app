from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, List
from datetime import date
from pydantic import BaseModel, Field
from app.core.security import decode_token
from app.services.prescription_service import prescription_service
from app.domain.entities.prescription import MedicineItem

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Request/Response Models
class CreatePrescriptionRequest(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    diagnosis: Optional[str] = Field(None, max_length=1000)
    diagnosis_ar: Optional[str] = Field(None, max_length=1000)
    medicines: List[MedicineItem] = []
    general_instructions: Optional[str] = Field(None, max_length=1000)
    general_instructions_ar: Optional[str] = Field(None, max_length=1000)
    valid_until: Optional[date] = None

class UpdatePrescriptionRequest(BaseModel):
    diagnosis: Optional[str] = Field(None, max_length=1000)
    diagnosis_ar: Optional[str] = Field(None, max_length=1000)
    medicines: Optional[List[MedicineItem]] = None
    general_instructions: Optional[str] = Field(None, max_length=1000)
    general_instructions_ar: Optional[str] = Field(None, max_length=1000)
    valid_until: Optional[date] = None

# Dependency to get current user
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from JWT token"""
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    from app.services.auth_service import auth_service
    user = await auth_service.get_user_by_id(payload.get("sub"))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

@router.post("/", response_model=dict)
async def create_prescription(
    request: CreatePrescriptionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new prescription (doctors only)"""
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can create prescriptions")
    
    try:
        prescription_data = {
            "doctor_id": str(current_user["_id"]),
            "patient_id": request.patient_id,
            "diagnosis": request.diagnosis,
            "diagnosis_ar": request.diagnosis_ar,
            "medicines": [medicine.dict() for medicine in request.medicines],
            "general_instructions": request.general_instructions,
            "general_instructions_ar": request.general_instructions_ar,
            "valid_until": request.valid_until
        }
        
        if request.appointment_id:
            prescription_data["appointment_id"] = request.appointment_id
        
        prescription = await prescription_service.create_prescription(prescription_data)
        
        return {
            "success": True,
            "message": "Prescription created successfully",
            "data": {
                "prescription_id": str(prescription["_id"]),
                "prescription_number": prescription["prescription_number"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create prescription")

@router.get("/my", response_model=dict)
async def get_my_prescriptions(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    """Get prescriptions for current user"""
    try:
        if current_user["role"] == "doctor":
            result = await prescription_service.get_prescriptions_by_doctor(
                str(current_user["_id"]), page, limit
            )
        elif current_user["role"] == "patient":
            result = await prescription_service.get_prescriptions_by_patient(
                str(current_user["_id"]), page, limit
            )
        else:
            raise HTTPException(status_code=403, detail="Invalid user role")
        
        return {
            "success": True,
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch prescriptions")

@router.get("/{prescription_id}", response_model=dict)
async def get_prescription(
    prescription_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get prescription details"""
    try:
        prescription = await prescription_service.get_prescription_by_id(prescription_id)
        
        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found")
        
        # Check if user has access to this prescription
        user_id = str(current_user["_id"])
        if prescription["doctor_id"] != user_id and prescription["patient_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "data": prescription
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch prescription")

@router.put("/{prescription_id}", response_model=dict)
async def update_prescription(
    prescription_id: str,
    request: UpdatePrescriptionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update prescription (doctors only)"""
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update prescriptions")
    
    try:
        # Verify the prescription belongs to this doctor
        prescription = await prescription_service.get_prescription_by_id(prescription_id)
        if not prescription:
            raise HTTPException(status_code=404, detail="Prescription not found")
        
        if prescription["doctor_id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Prepare update data
        update_data = {}
        if request.diagnosis is not None:
            update_data["diagnosis"] = request.diagnosis
        if request.diagnosis_ar is not None:
            update_data["diagnosis_ar"] = request.diagnosis_ar
        if request.medicines is not None:
            update_data["medicines"] = [medicine.dict() for medicine in request.medicines]
        if request.general_instructions is not None:
            update_data["general_instructions"] = request.general_instructions
        if request.general_instructions_ar is not None:
            update_data["general_instructions_ar"] = request.general_instructions_ar
        if request.valid_until is not None:
            update_data["valid_until"] = request.valid_until
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        success = await prescription_service.update_prescription(prescription_id, update_data)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to update prescription")
        
        return {
            "success": True,
            "message": "Prescription updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update prescription")

@router.get("/medicines/search", response_model=dict)
async def search_medicines(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
    current_user: dict = Depends(get_current_user)
):
    """Search for medicines"""
    try:
        medicines = await prescription_service.search_medicines(q, limit)
        
        return {
            "success": True,
            "data": medicines
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to search medicines")

@router.get("/stats/doctor", response_model=dict)
async def get_prescription_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get prescription statistics for doctor"""
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view prescription stats")
    
    try:
        stats = await prescription_service.get_prescription_stats(str(current_user["_id"]))
        
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch prescription stats")

@router.get("/patient/{patient_id}", response_model=dict)
async def get_patient_prescriptions(
    patient_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(get_current_user)
):
    """Get prescriptions for a specific patient (doctors only)"""
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view patient prescriptions")
    
    try:
        # Get prescriptions where this doctor treated this patient
        result = await prescription_service.get_prescriptions_by_patient(patient_id, page, limit)
        
        # Filter to only show prescriptions from current doctor
        doctor_id = str(current_user["_id"])
        filtered_prescriptions = [
            p for p in result["prescriptions"] 
            if p["doctor_id"] == doctor_id
        ]
        
        return {
            "success": True,
            "data": {
                "prescriptions": filtered_prescriptions,
                "total": len(filtered_prescriptions),
                "page": page,
                "limit": limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch patient prescriptions")