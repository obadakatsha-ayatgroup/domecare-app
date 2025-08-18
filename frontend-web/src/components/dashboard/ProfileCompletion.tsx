import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const ProfileCompletion: React.FC = () => {
  const { user } = useAuth()
  const completionPercentage = 40 // Calculate based on actual profile data

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Complete Your Profile
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>Your profile is {completionPercentage}% complete. Add more information to help patients find you.</p>
          </div>
          <div className="mt-4">
            <div className="w-full bg-yellow-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <div className="mt-3">
            <Link
              to={`/${user?.role}/profile`}
              className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
            >
              Complete Profile →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileCompletion