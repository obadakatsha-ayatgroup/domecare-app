from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, validator
from app.core.security import decode_token
from app.services.appointment_service import appointment_service
from app.services.doctor_service import doctor_service
from app.domain.entities.appointment import AppointmentStatus, AppointmentType, TimeSlot
from app.core.exceptions import NotFoundException, ValidationException, ConflictException
from datetime import datetime

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Request/Response Models
class CreateAppointmentRequest(BaseModel):
    doctor_id: str
    appointment_date: date
    time_slot: TimeSlot
    appointment_type: AppointmentType = AppointmentType.CONSULTATION
    reason: Optional[str] = Field(None, max_length=500)

class UpdateAppointmentStatusRequest(BaseModel):
    status: AppointmentStatus

class CancelAppointmentRequest(BaseModel):
    reason: str = Field(..., max_length=500)

class AppointmentResponse(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    appointment_date: date
    time_slot: TimeSlot
    status: AppointmentStatus
    appointment_type: AppointmentType
    reason: Optional[str]
    notes: Optional[str]
    consultation_fee: Optional[float]
    currency: str
    created_at: datetime
    doctor: Optional[dict] = None
    patient: Optional[dict] = None

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
async def create_appointment(
    request: CreateAppointmentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new appointment (patients only)"""
    if current_user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can book appointments")
    
    try:
        appointment_data = {
            "doctor_id": request.doctor_id,
            "patient_id": str(current_user["_id"]),
            "appointment_date": request.appointment_date,
            "time_slot": request.time_slot.dict(),
            "appointment_type": request.appointment_type,
            "reason": request.reason
        }
        
        appointment = await appointment_service.create_appointment(appointment_data)
        
        return {
            "success": True,
            "message": "Appointment created successfully",
            "data": {
                "appointment_id": str(appointment["_id"]),
                "status": "pending"
            }
        }
        
    except (ConflictException, ValidationException) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create appointment")

@router.get("/my", response_model=dict)
async def get_my_appointments(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get appointments for current user"""
    try:
        if current_user["role"] == "doctor":
            appointments = await appointment_service.get_appointments_by_doctor(
                str(current_user["_id"]), start_date, end_date
            )
        elif current_user["role"] == "patient":
            appointments = await appointment_service.get_appointments_by_patient(
                str(current_user["_id"]), start_date, end_date
            )
        else:
            raise HTTPException(status_code=403, detail="Invalid user role")
        
        return {
            "success": True,
            "data": appointments
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch appointments")

@router.get("/{appointment_id}", response_model=dict)
async def get_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get appointment details"""
    try:
        appointment = await appointment_service.get_appointment_by_id(appointment_id)
        
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        # Check if user has access to this appointment
        user_id = str(current_user["_id"])
        if appointment["doctor_id"] != user_id and appointment["patient_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "data": appointment
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch appointment")

@router.put("/{appointment_id}/status", response_model=dict)
async def update_appointment_status(
    appointment_id: str,
    request: UpdateAppointmentStatusRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update appointment status (doctors only)"""
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update appointment status")
    
    try:
        # Verify the appointment belongs to this doctor
        appointment = await appointment_service.get_appointment_by_id(appointment_id)
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        if appointment["doctor_id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        success = await appointment_service.update_appointment_status(
            appointment_id, request.status, str(current_user["_id"])
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to update appointment status")
        
        return {
            "success": True,
            "message": f"Appointment status updated to {request.status}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update appointment status")

@router.post("/{appointment_id}/cancel", response_model=dict)
async def cancel_appointment(
    appointment_id: str,
    request: CancelAppointmentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Cancel an appointment"""
    try:
        # Verify the appointment belongs to this user
        appointment = await appointment_service.get_appointment_by_id(appointment_id)
        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        user_id = str(current_user["_id"])
        if appointment["doctor_id"] != user_id and appointment["patient_id"] != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if appointment can be cancelled
        if appointment["status"] in [AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED]:
            raise HTTPException(status_code=400, detail="Cannot cancel this appointment")
        
        success = await appointment_service.cancel_appointment(
            appointment_id, user_id, request.reason
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to cancel appointment")
        
        return {
            "success": True,
            "message": "Appointment cancelled successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to cancel appointment")

@router.get("/doctors/{doctor_id}/slots", response_model=dict)
async def get_doctor_available_slots(
    doctor_id: str,
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    current_user: dict = Depends(get_current_user)
):
    """Get available time slots for a doctor on a specific date"""
    try:
        # Validate date format
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        
        # Verify doctor exists
        doctor = await doctor_service.get_doctor_by_id(doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        slots = await appointment_service.get_doctor_available_slots(doctor_id, date)
        
        return {
            "success": True,
            "data": {
                "date": date,
                "doctor_id": doctor_id,
                "available_slots": [slot.dict() for slot in slots]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch available slots")

@router.get("/today", response_model=dict)
async def get_today_appointments(
    current_user: dict = Depends(get_current_user)
):
    """Get today's appointments for current user"""
    try:
        today = date.today()
        
        if current_user["role"] == "doctor":
            appointments = await appointment_service.get_appointments_by_doctor(
                str(current_user["_id"]), today, today
            )
        elif current_user["role"] == "patient":
            appointments = await appointment_service.get_appointments_by_patient(
                str(current_user["_id"]), today, today
            )
        else:
            raise HTTPException(status_code=403, detail="Invalid user role")
        
        return {
            "success": True,
            "data": appointments
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch today's appointments")