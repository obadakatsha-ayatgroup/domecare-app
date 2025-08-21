import React, { useState } from 'react'
import { Calendar, Clock, User, Phone, MapPin, AlertCircle, CheckCircle } from 'lucide-react'
import { useQuery } from 'react-query'
import { appointmentService } from '@/services'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import LoadingScreen from '@/components/common/LoadingScreen'
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal'
import { PatientAppointment } from '@/types/appointments'
import toast from 'react-hot-toast'

const PatientAppointments: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [selectedAppointment, setSelectedAppointment] = useState<PatientAppointment | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const { data: appointmentsData, isLoading, refetch } = useQuery(
    ['patient-appointments'],
    () => appointmentService.getMyAppointments(),
    {
      onError: () => {
        toast.error('Failed to fetch appointments')
      }
    }
  )

  const handleCancel = async (appointmentId: string, reason: string) => {
    try {
      await appointmentService.cancelAppointment(appointmentId, reason)
      toast.success('Appointment cancelled successfully')
      refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to cancel appointment')
    }
  }

  const handleViewDetails = (appointment: PatientAppointment) => {
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

  const isUpcoming = (dateStr: string) => {
    const appointmentDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    appointmentDate.setHours(0, 0, 0, 0)
    return appointmentDate >= today
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  const appointments = appointmentsData?.data || []
  
  const filteredAppointments = appointments.filter((appointment: PatientAppointment) => {
    if (filter === 'upcoming') {
      return isUpcoming(appointment.appointment_date) && 
             !['cancelled', 'completed', 'no_show'].includes(appointment.status)
    }
    if (filter === 'past') {
      return !isUpcoming(appointment.appointment_date) || 
             ['cancelled', 'completed', 'no_show'].includes(appointment.status)
    }
    return true
  })

  const upcomingCount = appointments.filter((a: PatientAppointment) => 
    isUpcoming(a.appointment_date) && !['cancelled', 'completed', 'no_show'].includes(a.status)
  ).length

  const pastCount = appointments.length - upcomingCount

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <div className="text-sm text-gray-600">
          {appointments.length} total appointments
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'all'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All ({appointments.length})
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'upcoming'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'past'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past ({pastCount})
          </button>
        </nav>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600 text-lg">
            {filter === 'upcoming' ? 'No upcoming appointments' : 
             filter === 'past' ? 'No past appointments' : 'No appointments found'}
          </p>
          <p className="text-gray-500 mt-2">
            {filter === 'upcoming' && 'Book your first appointment with our doctors'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment: PatientAppointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              onViewDetails={handleViewDetails}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={showDetailsModal}
          onClose={() => {
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
  appointment: PatientAppointment
  onViewDetails: (appointment: PatientAppointment) => void
  onCancel: (appointmentId: string, reason: string) => void
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onViewDetails,
  onCancel
}) => {
  const [showCancelForm, setShowCancelForm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
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
        return <AlertCircle size={16} />
      case 'completed':
        return <CheckCircle size={16} />
      default:
        return <AlertCircle size={16} />
    }
  }

  const handleCancelSubmit = () => {
    if (cancelReason.trim()) {
      onCancel(appointment._id, cancelReason)
      setShowCancelForm(false)
      setCancelReason('')
    }
  }

  const canCancel = ['pending', 'confirmed'].includes(appointment.status)

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="text-primary-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {appointment.doctor.full_name}
              </h3>
              {appointment.doctor.specialties?.[0] && (
                <p className="text-sm text-primary-600">
                  {appointment.doctor.specialties[0].main_specialty}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar size={16} className="mr-2" />
                {formatDate(appointment.appointment_date)}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock size={16} className="mr-2" />
                {formatTime(appointment.time_slot.start_time)} - {formatTime(appointment.time_slot.end_time)}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="capitalize">
                  {appointment.appointment_type.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {appointment.doctor.clinic_info?.city && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={16} className="mr-2" />
                  {appointment.doctor.clinic_info.city}
                  {appointment.doctor.clinic_info.area && `, ${appointment.doctor.clinic_info.area}`}
                </div>
              )}
              {appointment.doctor.clinic_info?.clinic_phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone size={16} className="mr-2" />
                  {appointment.doctor.clinic_info.clinic_phone}
                </div>
              )}
              {appointment.consultation_fee && (
                <div className="text-sm text-gray-600">
                  <strong>Fee:</strong> {appointment.consultation_fee} {appointment.currency}
                </div>
              )}
            </div>
          </div>

          {appointment.reason && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Reason:</strong> {appointment.reason}
              </p>
            </div>
          )}

          {showCancelForm && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2">Cancel Appointment</h4>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows={3}
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              <div className="flex justify-end space-x-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleCancelSubmit}
                  disabled={!cancelReason.trim()}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end space-y-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
            {getStatusIcon(appointment.status)}
            <span className="ml-1">{appointment.status.replace('_', ' ')}</span>
          </span>

          <div className="flex flex-col space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(appointment)}
            >
              View Details
            </Button>

            {canCancel && !showCancelForm && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowCancelForm(true)}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default PatientAppointments