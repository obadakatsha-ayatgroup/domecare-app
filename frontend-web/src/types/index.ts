export enum UserRole {
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  ADMIN = 'admin',
}

export enum AuthMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  BOTH = 'both',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  DEACTIVATED = 'deactivated',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export interface User {
  id: string
  full_name: string
  email?: string
  phone_number?: string
  country_code?: string
  role: UserRole
  status: UserStatus
  profile_completed: boolean
  created_at: string
  updated_at: string
}

export interface Doctor extends User {
  specialties: Specialty[]
  certificates: Certificate[]
  bio?: string
  years_of_experience?: number
  clinic_info?: ClinicInfo
  rating?: number
  total_patients: number
  total_appointments: number
}

export interface Patient extends User {
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  blood_type?: string
  medical_history?: MedicalHistory
  emergency_contact?: EmergencyContact
}

export interface Specialty {
  main_specialty: string
  sub_specialty?: string
  certificate_url?: string
  verification_status: 'pending' | 'verified' | 'rejected'
}

export interface Certificate {
  name: string
  issuing_authority: string
  issue_date: string
  certificate_number?: string
  file_url?: string
}

export interface ClinicInfo {
  session_duration: 15 | 30 | 60
  schedule: WeekSchedule
  city?: string
  area?: string
  detailed_address?: string
  clinic_phone?: string
  clinic_email?: string
  consultation_fee?: number
  currency: string
}

export interface WeekSchedule {
  [key: string]: DaySchedule
}

export interface DaySchedule {
  is_working: boolean
  time_slots: TimeSlot[]
}

export interface TimeSlot {
  start_time: string
  end_time: string
}

export interface MedicalHistory {
  chronic_diseases: string[]
  allergies: string[]
  current_medications: string[]
  previous_surgeries: string[]
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone_number: string
}



export interface Prescription {
  id: string
  doctor_id: string
  patient_id: string
  medicines: Medicine[]
  diagnosis?: string
  notes?: string
  created_at: string
}

export interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}