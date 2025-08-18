import api from './api'
import { AuthMethod, UserRole } from '@/types'

export interface RegisterData {
  full_name: string
  email?: string
  phone_number?: string
  country_code: string
  password: string
  role: UserRole
  auth_method?: AuthMethod
}

export interface LoginData {
  identifier: string
  password: string
}

export interface VerifyOTPData {
  identifier: string
  otp: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: {
    id: string
    full_name: string
    email?: string
    phone_number?: string
    role: UserRole
    profile_completed: boolean
  }
}

class AuthService {
  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data)
    return response.data
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data)
    return response.data
  }

  async verifyOTP(data: VerifyOTPData) {
    const response = await api.post('/auth/verify', data)
    return response.data
  }

  async resendOTP(identifier: string) {
    const response = await api.post('/auth/resend-otp', { identifier })
    return response.data
  }

  async getAuthMethods() {
    const response = await api.get('/auth/method')
    return response.data
  }

  async forgotPassword(identifier: string) {
    const response = await api.post('/auth/forgot-password', { identifier })
    return response.data
  }

  async resetPassword(token: string, password: string) {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  }

  async logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
}

export default new AuthService()