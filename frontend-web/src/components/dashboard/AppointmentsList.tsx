import React from 'react'
import { Clock, User } from 'lucide-react'

const AppointmentsList: React.FC = () => {
  const appointments = [
    {
      id: 1,
      patient: 'Ahmad Hassan',
      time: '09:00 AM',
      type: 'Consultation',
      status: 'confirmed'
    },
    {
      id: 2,
      patient: 'Fatima Al-Rashid',
      time: '10:30 AM',
      type: 'Follow-up',
      status: 'pending'
    },
    {
      id: 3,
      patient: 'Ali Mohammed',
      time: '02:00 PM',
      type: 'Check-up',
      status: 'confirmed'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Today's Appointments</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {appointments.map((appointment) => (
          <div key={appointment.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">
                    {appointment.patient}
                  </p>
                  <p className="text-sm text-gray-500">{appointment.type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {appointment.time}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  appointment.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {appointment.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AppointmentsList