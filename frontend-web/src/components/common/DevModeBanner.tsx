import React, { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useFeatureFlags } from '@/contexts/FeatureFlagContext'

const DevModeBanner: React.FC = () => {
  const { flags } = useFeatureFlags()
  const [isVisible, setIsVisible] = useState(true)

  if (!flags.showDevBanner || !isVisible) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-600 mr-3" size={20} />
            <p className="text-sm text-yellow-800">
              <strong>Development Mode:</strong> Phone verification disabled • Mock OTP: 123456 • 
              Documents auto-approved • {flags.emailAuthEnabled ? 'Email' : 'Phone'} authentication active
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-yellow-600 hover:text-yellow-800"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default DevModeBanner