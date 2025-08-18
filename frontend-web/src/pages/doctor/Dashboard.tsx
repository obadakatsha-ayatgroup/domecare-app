import React from 'react'
import { Calendar, Users, FileText, Clock, Bell } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import AppointmentsList from '@/components/dashboard/AppointmentsList'
import QuickActions from '@/components/dashboard/QuickActions'
import ProfileCompletion from '@/components/dashboard/ProfileCompletion'
import { useAuth } from '@/contexts/AuthContext'

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth()

  const stats = [
    {
      title: "Today's Appointments",
      value: '5',
      icon: <Calendar className="text-primary-600" />,
      change: '+2 from yesterday',
      changeType: 'increase' as const,
    },
    {
      title: 'Total Patients',
      value: '48',
      icon: <Users className="text-secondary-600" />,
      change: '+5 this week',
      changeType: 'increase' as const,
    },
    {
      title: 'Prescriptions',
      value: '12',
      icon: <FileText className="text-purple-600" />,
      change: 'This month',
      changeType: 'neutral' as const,
    },
    {
      title: 'Avg. Consultation',
      value: '25 min',
      icon: <Clock className="text-orange-600" />,
      change: '-5 min',
      changeType: 'decrease' as const,
    },
  ]

  const quickActions = [
    { label: 'Add Appointment', icon: <Calendar />, href: '/doctor/appointments/new' },
    { label: 'New Prescription', icon: <FileText />, href: '/doctor/prescriptions/new' },
    { label: 'View Patients', icon: <Users />, href: '/doctor/patients' },
    { label: 'Update Schedule', icon: <Clock />, href: '/doctor/profile#schedule' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.full_name}!
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening in your practice today
            </p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell size={24} />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Profile Completion */}
      {!user?.profile_completed && <ProfileCompletion />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List - Takes 2 columns */}
        <div className="lg:col-span-2">
          <AppointmentsList />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions actions={quickActions} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">New patient registered: Sarah Ahmed</span>
            <span className="text-gray-400">10 minutes ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Appointment confirmed with Ali Hassan</span>
            <span className="text-gray-400">1 hour ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600">Prescription created for Fatima Al-Rashid</span>
            <span className="text-gray-400">2 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard