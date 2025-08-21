from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from bson import ObjectId
from app.core.database import db
from app.domain.entities.appointment import Appointment, AppointmentStatus, TimeSlot
from app.core.exceptions import NotFoundException, ValidationException, ConflictException
import logging

logger = logging.getLogger(__name__)

class AppointmentService:
    """Service for managing appointments"""
    
    def __init__(self):
        self.appointments_collection = None
        self.doctors_collection = None
        self.patients_collection = None
    
    async def init(self):
        """Initialize collections"""
        self.appointments_collection = db.get_collection("appointments")
        self.doctors_collection = db.get_collection("users")  # Doctors are users with role=doctor
        self.patients_collection = db.get_collection("users")  # Patients are users with role=patient
    
    async def create_appointment(self, appointment_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new appointment"""
        # Validate doctor exists and is available
        doctor = await self.doctors_collection.find_one({
            "_id": ObjectId(appointment_data["doctor_id"]),
            "role": "doctor",
            "status": "active"
        })
        if not doctor:
            raise NotFoundException("Doctor not found or unavailable")
        
        # Validate patient exists
        patient = await self.patients_collection.find_one({
            "_id": ObjectId(appointment_data["patient_id"]),
            "role": "patient",
            "status": "active"
        })
        if not patient:
            raise NotFoundException("Patient not found")
        
        # Check for conflicts
        await self._check_appointment_conflicts(
            appointment_data["doctor_id"],
            appointment_data["appointment_date"],
            appointment_data["time_slot"]
        )
        
        # Validate time slot is within doctor's schedule
        await self._validate_doctor_schedule(
            appointment_data["doctor_id"],
            appointment_data["appointment_date"],
            appointment_data["time_slot"]
        )
        
        # Prepare appointment data
        appointment_data["created_at"] = datetime.utcnow()
        appointment_data["updated_at"] = datetime.utcnow()
        appointment_data["doctor_id"] = ObjectId(appointment_data["doctor_id"])
        appointment_data["patient_id"] = ObjectId(appointment_data["patient_id"])
        
        # Add consultation fee from doctor's profile
        if doctor.get("clinic_info") and doctor["clinic_info"].get("consultation_fee"):
            appointment_data["consultation_fee"] = doctor["clinic_info"]["consultation_fee"]
            appointment_data["currency"] = doctor["clinic_info"].get("currency", "SYP")
        
        # Insert appointment
        result = await self.appointments_collection.insert_one(appointment_data)
        appointment_data["_id"] = result.inserted_id
        
        logger.info(f"Appointment created: {result.inserted_id}")
        return appointment_data
    
    async def get_appointments_by_doctor(self, doctor_id: str, 
                                       start_date: Optional[date] = None,
                                       end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """Get appointments for a doctor"""
        query = {"doctor_id": ObjectId(doctor_id)}
        
        if start_date and end_date:
            query["appointment_date"] = {
                "$gte": start_date,
                "$lte": end_date
            }
        
        appointments = await self.appointments_collection.find(query).sort("appointment_date", 1).to_list(None)
        
        # Populate patient information
        for appointment in appointments:
            patient = await self.patients_collection.find_one(
                {"_id": appointment["patient_id"]},
                {"password_hash": 0}  # Exclude sensitive data
            )
            appointment["patient"] = patient
            appointment["_id"] = str(appointment["_id"])
            appointment["doctor_id"] = str(appointment["doctor_id"])
            appointment["patient_id"] = str(appointment["patient_id"])
        
        return appointments
    
    async def get_appointments_by_patient(self, patient_id: str,
                                        start_date: Optional[date] = None,
                                        end_date: Optional[date] = None) -> List[Dict[str, Any]]:
        """Get appointments for a patient"""
        query = {"patient_id": ObjectId(patient_id)}
        
        if start_date and end_date:
            query["appointment_date"] = {
                "$gte": start_date,
                "$lte": end_date
            }
        
        appointments = await self.appointments_collection.find(query).sort("appointment_date", 1).to_list(None)
        
        # Populate doctor information
        for appointment in appointments:
            doctor = await self.doctors_collection.find_one(
                {"_id": appointment["doctor_id"]},
                {"password_hash": 0}  # Exclude sensitive data
            )
            appointment["doctor"] = doctor
            appointment["_id"] = str(appointment["_id"])
            appointment["doctor_id"] = str(appointment["doctor_id"])
            appointment["patient_id"] = str(appointment["patient_id"])
        
        return appointments
    
    async def get_appointment_by_id(self, appointment_id: str) -> Optional[Dict[str, Any]]:
        """Get appointment by ID with populated data"""
        appointment = await self.appointments_collection.find_one({"_id": ObjectId(appointment_id)})
        
        if not appointment:
            return None
        
        # Populate doctor and patient information
        doctor = await self.doctors_collection.find_one(
            {"_id": appointment["doctor_id"]},
            {"password_hash": 0}
        )
        patient = await self.patients_collection.find_one(
            {"_id": appointment["patient_id"]},
            {"password_hash": 0}
        )
        
        appointment["doctor"] = doctor
        appointment["patient"] = patient
        appointment["_id"] = str(appointment["_id"])
        appointment["doctor_id"] = str(appointment["doctor_id"])
        appointment["patient_id"] = str(appointment["patient_id"])
        
        return appointment
    
    async def update_appointment_status(self, appointment_id: str, 
                                      new_status: AppointmentStatus,
                                      user_id: str) -> bool:
        """Update appointment status"""
        update_data = {
            "status": new_status,
            "updated_at": datetime.utcnow()
        }
        
        if new_status == AppointmentStatus.CONFIRMED:
            update_data["confirmed_at"] = datetime.utcnow()
        elif new_status == AppointmentStatus.COMPLETED:
            update_data["completed_at"] = datetime.utcnow()
        elif new_status == AppointmentStatus.CANCELLED:
            update_data["cancelled_at"] = datetime.utcnow()
            update_data["cancelled_by"] = ObjectId(user_id)
        
        result = await self.appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    async def cancel_appointment(self, appointment_id: str, user_id: str, reason: str) -> bool:
        """Cancel an appointment"""
        update_data = {
            "status": AppointmentStatus.CANCELLED,
            "cancelled_at": datetime.utcnow(),
            "cancelled_by": ObjectId(user_id),
            "cancellation_reason": reason,
            "updated_at": datetime.utcnow()
        }
        
        result = await self.appointments_collection.update_one(
            {"_id": ObjectId(appointment_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
    
    async def get_doctor_available_slots(self, doctor_id: str, date_str: str) -> List[TimeSlot]:
        """Get available time slots for a doctor on a specific date"""
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        
        # Get doctor's schedule for the day
        doctor = await self.doctors_collection.find_one({"_id": ObjectId(doctor_id)})
        if not doctor or not doctor.get("clinic_info"):
            return []
        
        clinic_info = doctor["clinic_info"]
        day_name = target_date.strftime("%A").lower()
        
        if day_name not in clinic_info.get("schedule", {}):
            return []
        
        day_schedule = clinic_info["schedule"][day_name]
        if not day_schedule.get("is_working", False):
            return []
        
        # Get session duration
        session_duration = clinic_info.get("session_duration", 30)
        
        # Generate available slots
        available_slots = []
        for time_slot in day_schedule.get("time_slots", []):
            start_time = datetime.strptime(time_slot["start_time"], "%H:%M").time()
            end_time = datetime.strptime(time_slot["end_time"], "%H:%M").time()
            
            # Generate slots within this time range
            current_time = datetime.combine(target_date, start_time)
            end_datetime = datetime.combine(target_date, end_time)
            
            while current_time + timedelta(minutes=session_duration) <= end_datetime:
                slot_end = current_time + timedelta(minutes=session_duration)
                
                time_slot_obj = TimeSlot(
                    start_time=current_time.strftime("%H:%M"),
                    end_time=slot_end.strftime("%H:%M")
                )
                
                # Check if slot is available (not booked)
                if await self._is_slot_available(doctor_id, target_date, time_slot_obj):
                    available_slots.append(time_slot_obj)
                
                current_time = slot_end
        
        return available_slots
    
    async def _check_appointment_conflicts(self, doctor_id: str, appointment_date: date, time_slot: Dict[str, str]):
        """Check for appointment conflicts"""
        existing = await self.appointments_collection.find_one({
            "doctor_id": ObjectId(doctor_id),
            "appointment_date": appointment_date,
            "time_slot.start_time": time_slot["start_time"],
            "status": {"$nin": [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]}
        })
        
        if existing:
            raise ConflictException("Time slot already booked")
    
    async def _validate_doctor_schedule(self, doctor_id: str, appointment_date: date, time_slot: Dict[str, str]):
        """Validate appointment is within doctor's working hours"""
        doctor = await self.doctors_collection.find_one({"_id": ObjectId(doctor_id)})
        
        if not doctor or not doctor.get("clinic_info"):
            raise ValidationException("Doctor schedule not configured")
        
        clinic_info = doctor["clinic_info"]
        day_name = appointment_date.strftime("%A").lower()
        
        if day_name not in clinic_info.get("schedule", {}):
            raise ValidationException("Doctor doesn't work on this day")
        
        day_schedule = clinic_info["schedule"][day_name]
        if not day_schedule.get("is_working", False):
            raise ValidationException("Doctor doesn't work on this day")
        
        # Check if requested time falls within working hours
        requested_start = datetime.strptime(time_slot["start_time"], "%H:%M").time()
        requested_end = datetime.strptime(time_slot["end_time"], "%H:%M").time()
        
        is_valid_time = False
        for work_slot in day_schedule.get("time_slots", []):
            work_start = datetime.strptime(work_slot["start_time"], "%H:%M").time()
            work_end = datetime.strptime(work_slot["end_time"], "%H:%M").time()
            
            if work_start <= requested_start and requested_end <= work_end:
                is_valid_time = True
                break
        
        if not is_valid_time:
            raise ValidationException("Requested time is outside doctor's working hours")
    
    async def _is_slot_available(self, doctor_id: str, date: date, time_slot: TimeSlot) -> bool:
        """Check if a time slot is available"""
        existing = await self.appointments_collection.find_one({
            "doctor_id": ObjectId(doctor_id),
            "appointment_date": date,
            "time_slot.start_time": time_slot.start_time,
            "status": {"$nin": [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]}
        })
        
        return existing is None

# Global service instance
appointment_service = AppointmentService()