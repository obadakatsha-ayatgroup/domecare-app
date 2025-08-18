import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import authService, { AuthResponse, LoginData, RegisterData } from '@/services/authService'
import { UserRole } from '@/types'
import toast from 'react-hot-toast'

interface User {
  id: string
  full_name: string
  email?: string
  phone_number?: string
  role: UserRole
  profile_completed: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('access_token')

    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }

    setIsLoading(false)
  }, [])

  const login = async (data: LoginData) => {
    try {
      const response: AuthResponse = await authService.login(data)
      
      // Store tokens
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      setUser(response.user)
      
      // Navigate based on role
      if (response.user.role === UserRole.DOCTOR) {
        navigate('/doctor/dashboard')
      } else if (response.user.role === UserRole.PATIENT) {
        navigate('/patient/dashboard')
      }
      
      toast.success('Login successful!')
    } catch (error: any) {
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data)
      
      // Navigate to OTP verification
      navigate('/verify', { 
        state: { 
          identifier: data.email || data.phone_number,
          isEmail: !!data.email 
        } 
      })
      
      toast.success(response.message)
    } catch (error: any) {
      throw error
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}