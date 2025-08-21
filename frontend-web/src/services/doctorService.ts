import api from './api'

export interface DoctorSearchParams {
  specialty?: string
  city?: string
  name?: string
  min_rating?: string
  max_fee?: string
  page?: number
  limit?: number
}

export interface UpdateDoctorProfileData {
  bio?: string
  years_of_experience?: number
  consultation_fee?: number
  clinic_phone?: string
  clinic_email?: string
  city?: string
  area?: string
  detailed_address?: string
}

export interface UpdateScheduleData {
  schedule: {
    [key: string]: {
      is_working: boolean
      time_slots: Array<{
        start_time: string
        end_time: string
      }>
    }
  }
}

class DoctorService {
  async searchDoctors(params: DoctorSearchParams) {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.append(key, value.toString())
      }
    })
    
    const response = await api.get(`/doctors/search?${searchParams}`)
    return response.data
  }

  async getDoctorById(doctorId: string) {
    const response = await api.get(`/doctors/${doctorId}`)
    return response.data
  }

  async getSpecialties() {
    const response = await api.get('/doctors/specialties')
    return response.data
  }

  async getCities() {
    const response = await api.get('/doctors/cities')
    return response.data
  }

  async updateProfile(data: UpdateDoctorProfileData) {
    const response = await api.put('/doctors/profile', data)
    return response.data
  }

  async updateSchedule(data: UpdateScheduleData) {
    const response = await api.put('/doctors/schedule', data)
    return response.data
  }

  async getMyProfile() {
    const response = await api.get('/doctors/me')
    return response.data
  }

  async getStats() {
    const response = await api.get('/doctors/profile/stats')
    return response.data
  }
}

export default new DoctorService()