import api from './api'
import { TimeSlot } from '@/types/appointments'

export interface CreateAppointmentData {
  doctor_id: string
  appointment_date: string
  time_slot: TimeSlot
  appointment_type: 'consultation' | 'follow_up' | 'check_up' | 'emergency'
  reason?: string
}

export interface UpdateAppointmentStatusData {
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
}

class AppointmentService {
  async createAppointment(data: CreateAppointmentData) {
    const response = await api.post('/appointments/', data)
    return response.data
  }

  async getMyAppointments(startDate?: string, endDate?: string) {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const response = await api.get(`/appointments/my?${params}`)
    return response.data
  }

  async getTodayAppointments() {
    const response = await api.get('/appointments/today')
    return response.data
  }

  async getAppointment(appointmentId: string) {
    const response = await api.get(`/appointments/${appointmentId}`)
    return response.data
  }

  async updateAppointmentStatus(appointmentId: string, data: UpdateAppointmentStatusData) {
    const response = await api.put(`/appointments/${appointmentId}/status`, data)
    return response.data
  }

  async cancelAppointment(appointmentId: string, reason: string) {
    const response = await api.post(`/appointments/${appointmentId}/cancel`, { reason })
    return response.data
  }

  async getAvailableSlots(doctorId: string, date: string) {
    const response = await api.get(`/appointments/doctors/${doctorId}/slots?date=${date}`)
    return response.data
  }
}

export default new AppointmentService()