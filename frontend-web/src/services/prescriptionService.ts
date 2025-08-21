import api from './api'

export interface MedicineItem {
  name: string
  name_ar?: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  instructions_ar?: string
}

export interface CreatePrescriptionData {
  patient_id: string
  appointment_id?: string
  diagnosis?: string
  diagnosis_ar?: string
  medicines: MedicineItem[]
  general_instructions?: string
  general_instructions_ar?: string
  valid_until?: string
}

export interface UpdatePrescriptionData {
  diagnosis?: string
  diagnosis_ar?: string
  medicines?: MedicineItem[]
  general_instructions?: string
  general_instructions_ar?: string
  valid_until?: string
}

class PrescriptionService {
  async createPrescription(data: CreatePrescriptionData) {
    const response = await api.post('/prescriptions/', data)
    return response.data
  }

  async getMyPrescriptions(page: number = 1, limit: number = 20) {
    const response = await api.get(`/prescriptions/my?page=${page}&limit=${limit}`)
    return response.data
  }

  async getPrescription(prescriptionId: string) {
    const response = await api.get(`/prescriptions/${prescriptionId}`)
    return response.data
  }

  async updatePrescription(prescriptionId: string, data: UpdatePrescriptionData) {
    const response = await api.put(`/prescriptions/${prescriptionId}`, data)
    return response.data
  }

  async searchMedicines(query: string, limit: number = 10) {
    const response = await api.get(`/prescriptions/medicines/search?q=${query}&limit=${limit}`)
    return response.data
  }

  async getStats() {
    const response = await api.get('/prescriptions/stats/doctor')
    return response.data
  }

  async getPatientPrescriptions(patientId: string, page: number = 1, limit: number = 20) {
    const response = await api.get(`/prescriptions/patient/${patientId}?page=${page}&limit=${limit}`)
    return response.data
  }
}

export default new PrescriptionService()