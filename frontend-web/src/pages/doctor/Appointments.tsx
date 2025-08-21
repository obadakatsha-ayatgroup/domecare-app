import React, { useState } from 'react'
import { Calendar, Clock, User, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useQuery } from 'react-query'
import { appointmentService } from '@/services'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import LoadingScreen from '@/components/common/LoadingScreen'
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal'
import { DoctorAppointment } from '@/types/appointments'
import toast from 'react-hot-toast'



const DoctorAppointments: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Get today's date as default
  const today = new Date().toISOString().split('T')[0]

  const { data: appointmentsData, isLoading, refetch } = useQuery(
    ['doctor-appointments', selectedDate],
    () => appointmentService.getMyAppointments(
      selectedDate || today,
      selectedDate || today
    ),
    {
      onError: () => {
        toast.error('Failed to fetch appointments')
      }
    }
  )

  const { data: todayData } = useQuery(
    ['today-appointments'],
    () => appointmentService.getTodayAppointments()
  )
  const appointments: DoctorAppointment[] = appointmentsData?.data || []
  const todayAppointments: DoctorAppointment[] = todayData?.data || []

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, { status: newStatus as any })
      toast.success(`Appointment ${newStatus}`)
      refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update appointment')
    }
  }

  const handleViewDetails = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'no_show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} />
      case 'pending':
        return <AlertCircle size={16} />
      case 'cancelled':
      case 'no_show':
        return <XCircle size={16} />
      case 'completed':
        return <CheckCircle size={16} />
      default:
        return <AlertCircle size={16} />
    }
  }

  if (isLoading && !appointmentsData) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">View date:</span>
          <input
            type="date"
            value={selectedDate || today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {todayAppointments.length}
              </p>
            </div>
            <Calendar className="text-primary-600" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {todayAppointments.filter((a: DoctorAppointment) => a.status === 'confirmed').length}
              </p>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {todayAppointments.filter((a: DoctorAppointment) => a.status === 'pending').length}
              </p>
            </div>
            <AlertCircle className="text-yellow-600" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-blue-600">
                {todayAppointments.filter((a: DoctorAppointment) => a.status === 'completed').length}
              </p>
            </div>
            <CheckCircle className="text-blue-600" size={24} />
          </div>
        </Card>
      </div>

      {/* Appointments List */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Appointments for {selectedDate ? formatDate(selectedDate) : 'Today'}
          </h3>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg">No appointments scheduled</p>
            <p className="text-gray-500 mt-2">
              {selectedDate ? 'Try selecting a different date' : 'Your schedule is clear for today'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {appointments.map((appointment: DoctorAppointment) => (
              <AppointmentCard
                key={appointment._id}
                appointment={appointment}
                onStatusUpdate={handleStatusUpdate}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedAppointment(null)
          }}
          onStatusUpdate={(appointmentId, status) => {
            handleStatusUpdate(appointmentId, status)
            setShowDetailsModal(false)
            setSelectedAppointment(null)
          }}
        />
      )}

      <div className="divide-y divide-gray-200">
        {appointments.map((appointment: DoctorAppointment) => (
          <AppointmentCard
            key={appointment._id}
            appointment={appointment}
            onStatusUpdate={handleStatusUpdate}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedAppointment(null)
          }}
          onStatusUpdate={(appointmentId, status) => {
            handleStatusUpdate(appointmentId, status)
            setShowDetailsModal(false)
            setSelectedAppointment(null)
          }}
        />
      )}
    </div>
  )
}

// Appointment Card Component
interface AppointmentCardProps {
  appointment: DoctorAppointment
  onStatusUpdate: (appointmentId: string, status: string) => void
  onViewDetails: (appointment: DoctorAppointment) => void
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onStatusUpdate,
  onViewDetails
}) => {
  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'no_show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle size={16} />
      case 'pending':
        return <AlertCircle size={16} />
      case 'cancelled':
      case 'no_show':
        return <XCircle size={16} />
      case 'completed':
        return <CheckCircle size={16} />
      default:
        return <AlertCircle size={16} />
    }
  }

  return (
    <div className="px-6 py-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="text-gray-600" size={24} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {appointment.patient.full_name}
              </p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                {getStatusIcon(appointment.status)}
                <span className="ml-1">{appointment.status.replace('_', ' ')}</span>
              </span>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Clock size={16} className="mr-1" />
                {formatTime(appointment.time_slot.start_time)} - {formatTime(appointment.time_slot.end_time)}
              </span>

              <span className="capitalize">
                {appointment.appointment_type.replace('_', ' ')}
              </span>

              {appointment.consultation_fee && (
                <span>
                  {appointment.consultation_fee} {appointment.currency}
                </span>
              )}
            </div>

            {appointment.reason && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                {appointment.reason}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {appointment.patient.phone_number && (
            <Button
              variant="outline"
              size="sm"
              icon={<Phone size={16} />}
              onClick={() => window.open(`tel:${appointment.patient.phone_number}`)}
            >
              Call
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(appointment)}
          >
            Details
          </Button>

          {appointment.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onStatusUpdate(appointment._id, 'confirmed')}
            >
              Confirm
            </Button>
          )}

          {appointment.status === 'confirmed' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onStatusUpdate(appointment._id, 'completed')}
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DoctorAppointments