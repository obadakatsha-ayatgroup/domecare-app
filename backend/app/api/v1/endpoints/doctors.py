from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, List
from pydantic import BaseModel, Field
from app.core.security import decode_token
from app.services.doctor_service import doctor_service
from app.services.appointment_service import appointment_service
from datetime import datetime

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Request/Response Models
class DoctorSearchResponse(BaseModel):
    doctors: List[dict]
    total: int
    page: int
    pages: int
    limit: int

class UpdateDoctorProfileRequest(BaseModel):
    bio: Optional[str] = Field(None, max_length=500)
    years_of_experience: Optional[int] = Field(None, ge=0, le=50)
    consultation_fee: Optional[float] = Field(None, ge=0)
    clinic_phone: Optional[str] = None
    clinic_email: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    detailed_address: Optional[str] = None

class UpdateScheduleRequest(BaseModel):
    schedule: dict = Field(..., description="Weekly schedule configuration")

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

# Optional authentication (for public endpoints)
async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)):
    """Get current user from JWT token (optional)"""
    if not token:
        return None
    
    try:
        payload = decode_token(token)
        if not payload:
            return None
        
        from app.services.auth_service import auth_service
        user = await auth_service.get_user_by_id(payload.get("sub"))
        return user
    except:
        return None

@router.get("/search", response_model=dict)
async def search_doctors(
    specialty: Optional[str] = Query(None, description="Doctor specialty"),
    city: Optional[str] = Query(None, description="City"),
    name: Optional[str] = Query(None, description="Doctor name"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum rating"),
    max_fee: Optional[float] = Query(None, ge=0, description="Maximum consultation fee"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Search for doctors with filters"""
    try:
        result = await doctor_service.search_doctors(
            specialty=specialty,
            city=city,
            name=name,
            min_rating=min_rating,
            max_fee=max_fee,
            page=page,
            limit=limit
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to search doctors")

@router.get("/specialties", response_model=dict)
async def get_specialties():
    """Get list of available doctor specialties"""
    try:
        specialties = await doctor_service.get_doctor_specialties()
        
        return {
            "success": True,
            "data": specialties
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch specialties")

@router.get("/cities", response_model=dict)
async def get_cities():
    """Get list of cities with available doctors"""
    try:
        cities = await doctor_service.get_cities_with_doctors()
        
        return {
            "success": True,
            "data": cities
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch cities")

@router.get("/{doctor_id}", response_model=dict)
async def get_doctor_details(
    doctor_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get doctor details by ID"""
    try:
        doctor = await doctor_service.get_doctor_by_id(doctor_id)
        
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        
        # Get doctor stats for enhanced profile
        stats = await doctor_service.get_doctor_stats(doctor_id)
        doctor["stats"] = stats
        
        return {
            "success": True,
            "data": doctor
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch doctor details")

@router.put("/profile", response_model=dict)
async def update_doctor_profile(
    request: UpdateDoctorProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update doctor profile (doctors only)"""
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update their profile")
    
    try:
        update_data = {}
        
        # Basic profile updates
        if request.bio is not None:
            update_data["bio"] = request.bio
        if request.years_of_experience is not None:
            update_data["years_of_experience"] = request.years_of_experience
        
        # Clinic info updates
        clinic_updates = {}
        if request.consultation_fee is not None:
            clinic_updates["consultation_fee"] = request.consultation_fee
        if request.clinic_phone is not None:
            clinic_updates["clinic_phone"] = request.clinic_phone
        if request.clinic_email is not None:
            clinic_updates["clinic_email"] = request.clinic_email
        if request.city is not None:
            clinic_updates["city"] = request.city
        if request.area is not None:
            clinic_updates["area"] = request.area
        if request.detailed_address is not None:
            clinic_updates["detailed_address"] = request.detailed_address
        
        # Update clinic info if there are clinic-related changes
        if clinic_updates:
            for key, value in clinic_updates.items():
                update_data[f"clinic_info.{key}"] = value
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        success = await doctor_service.update_doctor_profile(
            str(current_user["_id"]), update_data
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to update profile")
        
        return {
            "success": True,
            "message": "Profile updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.put("/schedule", response_model=dict)
async def update_doctor_schedule(
    request: UpdateScheduleRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update doctor working schedule (doctors only)"""
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can update their schedule")
    
    try:
        # Validate schedule format
        valid_days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        
        for day, schedule in request.schedule.items():
            if day not in valid_days:
                raise HTTPException(status_code=400, detail=f"Invalid day: {day}")
            
            if not isinstance(schedule, dict):
                raise HTTPException(status_code=400, detail=f"Invalid schedule format for {day}")
            
            # Validate time slots if working day
            if schedule.get("is_working", False):
                time_slots = schedule.get("time_slots", [])
                for slot in time_slots:
                    if not all(key in slot for key in ["start_time", "end_time"]):
                        raise HTTPException(status_code=400, detail="Invalid time slot format")
        
        success = await doctor_service.update_doctor_schedule(
            str(current_user["_id"]), request.schedule
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to update schedule")
        
        return {
            "success": True,
            "message": "Schedule updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update schedule")

@router.get("/profile/stats", response_model=dict)
async def get_doctor_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get doctor statistics (doctors only)"""
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can view their stats")
    
    try:
        stats = await doctor_service.get_doctor_stats(str(current_user["_id"]))
        
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch doctor stats")

@router.get("/me", response_model=dict)
async def get_my_doctor_profile(
    current_user: dict = Depends(get_current_user)
):
    """Get current doctor's profile"""
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can access this endpoint")
    
    try:
        doctor = await doctor_service.get_doctor_by_id(str(current_user["_id"]))
        
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor profile not found")
        
        # Add stats
        stats = await doctor_service.get_doctor_stats(str(current_user["_id"]))
        doctor["stats"] = stats
        
        return {
            "success": True,
            "data": doctor
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch profile")