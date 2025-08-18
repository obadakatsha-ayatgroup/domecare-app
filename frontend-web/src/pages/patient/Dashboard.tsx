import React from 'react'
import { Calendar, Clock, User, FileText } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import { useAuth } from '@/contexts/AuthContext'

const PatientDashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your health appointments and records
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Upcoming Appointments"
          value="2"
          icon={<Calendar className="text-primary-600" />}
          change="Next: Tomorrow"
          changeType="neutral"
        />
        <StatsCard
          title="Past Visits"
          value="8"
          icon={<Clock className="text-secondary-600" />}
          change="Last: 2 weeks ago"
          changeType="neutral"
        />
        <StatsCard
          title="Prescriptions"
          value="3"
          icon={<FileText className="text-purple-600" />}
          change="Active"
          changeType="neutral"
        />
        <StatsCard
          title="Doctors"
          value="4"
          icon={<User className="text-orange-600" />}
          change="In your network"
          changeType="neutral"
        />
      </div>
    </div>
  )
}

export default PatientDashboard