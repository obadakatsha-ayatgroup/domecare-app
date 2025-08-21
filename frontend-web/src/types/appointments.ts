export interface TimeSlot {
  start_time: string
  end_time: string
}

export interface AppointmentPerson {
  full_name: string
  phone_number?: string
  email?: string
}

export interface Doctor extends AppointmentPerson {
  specialties?: Array<{
    main_specialty: string
    sub_specialty?: string
  }>
  clinic_info?: {
    city?: string
    area?: string
    clinic_phone?: string
    consultation_fee?: number
    currency?: string
  }
}

export interface Patient extends AppointmentPerson {}

export interface BaseAppointment {
  _id: string
  appointment_date: string
  time_slot: TimeSlot
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  appointment_type: string
  reason?: string
  notes?: string
  consultation_fee?: number
  currency: string
  cancellation_reason?: string
  created_at?: string
  updated_at?: string
}

// For doctor view - has patient info
export interface DoctorAppointment extends BaseAppointment {
  patient: Patient
  doctor?: Doctor
}

// For patient view - has doctor info
export interface PatientAppointment extends BaseAppointment {
  doctor: Doctor
  patient?: Patient
}

// Union type for components that can handle both
export type Appointment = DoctorAppointment | PatientAppointment

// Type guards
export const isDoctorAppointment = (appointment: Appointment): appointment is DoctorAppointment => {
  return 'patient' in appointment && appointment.patient !== undefined
}

export const isPatientAppointment = (appointment: Appointment): appointment is PatientAppointment => {
  return 'doctor' in appointment && appointment.doctor !== undefined
}