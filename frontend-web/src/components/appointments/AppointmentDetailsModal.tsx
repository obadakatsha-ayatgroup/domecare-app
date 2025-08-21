import React, { useState } from 'react'
import { X, User, Calendar, Clock, Phone, Mail, FileText, AlertCircle } from 'lucide-react'
import Button from '@/components/common/Button'
import { useAuth } from '@/contexts/AuthContext'
import { Appointment, isDoctorAppointment, isPatientAppointment } from '@/types/appointments'

interface AppointmentDetailsModalProps {
  appointment: Appointment
  isOpen: boolean
  onClose: () => void
  onStatusUpdate?: (appointmentId: string, status: string) => void
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onStatusUpdate
}) => {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!onStatusUpdate) return

    setIsUpdating(true)
    try {
      await onStatusUpdate(appointment._id, newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!onStatusUpdate || !cancelReason.trim()) return

    setIsUpdating(true)
    try {
      await onStatusUpdate(appointment._id, 'cancelled')
      setShowCancelForm(false)
      setCancelReason('')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isOpen) return null

  const isDoctor = user?.role === 'doctor'
  const canUpdateStatus = isDoctor && onStatusUpdate
  
  // Get the other person's info based on user role
  const otherPerson = isDoctor 
    ? (isDoctorAppointment(appointment) ? appointment.patient : null)
    : (isPatientAppointment(appointment) ? appointment.doctor : null)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
            <p className="text-gray-600 mt-1">
              {formatDate(appointment.appointment_date)} at {formatTime(appointment.time_slot.start_time)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                {appointment.status.replace('_', ' ').charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>
            
            {appointment.consultation_fee && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Consultation Fee</p>
                <p className="text-lg font-semibold text-gray-900">
                  {appointment.consultation_fee} {appointment.currency}
                </p>
              </div>
            )}
          </div>

          {/* Appointment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Appointment Details</h3>
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
                  <FileText size={16} className="mr-2" />
                  {appointment.appointment_type.replace('_', ' ').charAt(0).toUpperCase() + appointment.appointment_type.slice(1)}
                </div>
              </div>
            </div>

            {/* Patient/Doctor Info */}
            {otherPerson && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {isDoctor ? 'Patient' : 'Doctor'} Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User size={16} className="mr-2" />
                    {otherPerson.full_name}
                  </div>
                  {otherPerson.phone_number && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone size={16} className="mr-2" />
                      <a 
                        href={`tel:${otherPerson.phone_number}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {otherPerson.phone_number}
                      </a>
                    </div>
                  )}
                  {otherPerson.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail size={16} className="mr-2" />
                      <a 
                        href={`mailto:${otherPerson.email}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {otherPerson.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reason */}
          {appointment.reason && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Reason for Visit</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {appointment.reason}
              </p>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Doctor's Notes</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Cancellation Reason */}
          {appointment.status === 'cancelled' && appointment.cancellation_reason && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Cancellation Reason</h3>
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="text-red-500 mr-2 mt-0.5" size={16} />
                  <p className="text-sm text-red-700">
                    {appointment.cancellation_reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Form */}
          {showCancelForm && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800 mb-2">Cancel Appointment</h3>
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
                  onClick={handleCancel}
                  loading={isUpdating}
                  disabled={!cancelReason.trim()}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="flex space-x-2">
            {canUpdateStatus && appointment.status === 'pending' && (
              <Button
                onClick={() => handleStatusUpdate('confirmed')}
                loading={isUpdating}
                disabled={isUpdating}
              >
                Confirm
              </Button>
            )}

            {canUpdateStatus && appointment.status === 'confirmed' && (
              <Button
                variant="secondary"
                onClick={() => handleStatusUpdate('completed')}
                loading={isUpdating}
                disabled={isUpdating}
              >
                Mark as Completed
              </Button>
            )}

            {canUpdateStatus && appointment.status === 'confirmed' && (
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate('no_show')}
                loading={isUpdating}
                disabled={isUpdating}
              >
                No Show
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            {canUpdateStatus && ['pending', 'confirmed'].includes(appointment.status) && !showCancelForm && (
              <Button
                variant="danger"
                onClick={() => setShowCancelForm(true)}
                disabled={isUpdating}
              >
                Cancel Appointment
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUpdating}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppointmentDetailsModal