import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, AlertCircle } from 'lucide-react'
import { useQuery } from 'react-query'
import { appointmentService } from '@/services/'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import toast from 'react-hot-toast'

interface Doctor {
  _id: string
  full_name: string
  specialties: Array<{
    main_specialty: string
  }>
  clinic_info?: {
    consultation_fee?: number
    currency: string
  }
}

interface TimeSlot {
  start_time: string
  end_time: string
}

interface BookAppointmentModalProps {
  doctor: Doctor
  isOpen: boolean
  onClose: () => void
}

const BookAppointmentModal: React.FC<BookAppointmentModalProps> = ({
  doctor,
  isOpen,
  onClose
}) => {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [appointmentType, setAppointmentType] = useState('consultation')
  const [reason, setReason] = useState('')
  const [isBooking, setIsBooking] = useState(false)

  // Get tomorrow's date as minimum selectable date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  // Get available slots for selected date
  const { data: slotsData, isLoading: slotsLoading, refetch: refetchSlots } = useQuery(
    ['available-slots', doctor._id, selectedDate],
    () => appointmentService.getAvailableSlots(doctor._id, selectedDate),
    {
      enabled: !!selectedDate,
      onError: () => {
        toast.error('Failed to fetch available slots')
      }
    }
  )

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null) // Reset selected slot when date changes
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
  }

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedSlot) {
      toast.error('Please select date and time')
      return
    }

    setIsBooking(true)
    try {
      await appointmentService.createAppointment({
        doctor_id: doctor._id,
        appointment_date: selectedDate,
        time_slot: selectedSlot,
        appointment_type: appointmentType as any,
        reason
      })

      toast.success('Appointment booked successfully!')
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to book appointment')
    } finally {
      setIsBooking(false)
    }
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
            <p className="text-gray-600 mt-1">
              with Dr. {doctor.full_name}
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
          {/* Doctor Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Dr. {doctor.full_name}</h3>
            <p className="text-primary-600 text-sm mb-2">
              {doctor.specialties?.[0]?.main_specialty}
            </p>
            {doctor.clinic_info?.consultation_fee && (
              <p className="text-sm text-gray-600">
                Consultation Fee: {doctor.clinic_info.consultation_fee} {doctor.clinic_info.currency}
              </p>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <Input
              type="date"
              value={selectedDate}
              min={minDate}
              onChange={(e) => handleDateChange(e.target.value)}
              icon={<Calendar size={20} />}
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Time Slots for {formatDate(selectedDate)}
              </label>
              
              {slotsLoading ? (
                <div className="text-center py-4">
                  <p className="text-gray-600">Loading available slots...</p>
                </div>
              ) : slotsData?.data?.available_slots?.length === 0 ? (
                <div className="text-center py-4 bg-yellow-50 rounded-lg">
                  <AlertCircle className="mx-auto text-yellow-600 mb-2" size={24} />
                  <p className="text-yellow-800">No available slots for this date</p>
                  <p className="text-yellow-600 text-sm mt-1">Please try another date</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {slotsData?.data?.available_slots?.map((slot: TimeSlot, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleSlotSelect(slot)}
                      className={`p-3 text-sm rounded-lg border transition-colors ${
                        selectedSlot?.start_time === slot.start_time
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <Clock size={16} className="mr-1" />
                        {formatTime(slot.start_time)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Appointment Type */}
          <div>
            <Select
              label="Appointment Type"
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
            >
              <option value="consultation">Consultation</option>
              <option value="follow_up">Follow-up</option>
              <option value="check_up">Check-up</option>
              <option value="emergency">Emergency</option>
            </Select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Visit (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe your symptoms or reason for the appointment..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length}/500 characters
            </p>
          </div>

          {/* Booking Summary */}
          {selectedDate && selectedSlot && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Booking Summary</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Doctor:</strong> Dr. {doctor.full_name}</p>
                <p><strong>Date:</strong> {formatDate(selectedDate)}</p>
                <p><strong>Time:</strong> {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</p>
                <p><strong>Type:</strong> {appointmentType.replace('_', ' ').charAt(0).toUpperCase() + appointmentType.slice(1)}</p>
                {doctor.clinic_info?.consultation_fee && (
                  <p><strong>Fee:</strong> {doctor.clinic_info.consultation_fee} {doctor.clinic_info.currency}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isBooking}
          >
            Cancel
          </Button>
          <Button
            onClick={handleBookAppointment}
            loading={isBooking}
            disabled={!selectedDate || !selectedSlot}
          >
            Book Appointment
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BookAppointmentModal