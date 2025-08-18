import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/services/api'

interface FeatureFlags {
  phoneVerificationEnabled: boolean
  mockMode: boolean
  emailAuthEnabled: boolean
  autoApproveDocuments: boolean
  showDevBanner: boolean
}

interface FeatureFlagContextType {
  flags: FeatureFlags
  isLoading: boolean
  checkFlag: (flag: keyof FeatureFlags) => boolean
}

const defaultFlags: FeatureFlags = {
  phoneVerificationEnabled: false,
  mockMode: true,
  emailAuthEnabled: true,
  autoApproveDocuments: true,
  showDevBanner: true,
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined)

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider')
  }
  return context
}

interface FeatureFlagProviderProps {
  children: ReactNode
}

export const FeatureFlagProvider: React.FC<FeatureFlagProviderProps> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFeatureFlags()
  }, [])

  const fetchFeatureFlags = async () => {
    try {
      const response = await api.get('/auth/method')
      const features = response.data.data.features
      
      setFlags({
        phoneVerificationEnabled: features.phone_verification || false,
        mockMode: response.data.data.mock_mode || true,
        emailAuthEnabled: features.email_auth || true,
        autoApproveDocuments: features.auto_approve_documents || true,
        showDevBanner: response.data.data.mock_mode || false,
      })
    } catch (error) {
      console.error('Failed to fetch feature flags:', error)
      // Use default flags on error
    } finally {
      setIsLoading(false)
    }
  }

  const checkFlag = (flag: keyof FeatureFlags): boolean => {
    return flags[flag]
  }

  const value = {
    flags,
    isLoading,
    checkFlag,
  }

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  )
}