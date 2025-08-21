import React from 'react'
import { X, User, Calendar, FileText, Pill, Clock } from 'lucide-react'
import Button from '@/components/common/Button'
import { useAuth } from '@/contexts/AuthContext'

interface Medicine {
  name: string
  name_ar?: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

interface Prescription {
  _id: string
  prescription_number: string
  patient?: {
    full_name: string
    phone_number?: string
    email?: string
  }
  doctor?: {
    full_name: string
    phone_number?: string
    email?: string
    specialties?: Array<{
      main_specialty: string
    }>
  }
  diagnosis?: string
  diagnosis_ar?: string
  medicines: Medicine[]
  general_instructions?: string
  general_instructions_ar?: string
  created_at: string
  valid_until?: string
}

interface PrescriptionDetailsModalProps {
  prescription: Prescription
  isOpen: boolean
  onClose: () => void
}

const PrescriptionDetailsModal: React.FC<PrescriptionDetailsModalProps> = ({
  prescription,
  isOpen,
  onClose
}) => {
  const { user } = useAuth()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isExpired = () => {
    if (!prescription.valid_until) return false
    return new Date(prescription.valid_until) < new Date()
  }

  const daysUntilExpiry = () => {
    if (!prescription.valid_until) return null
    const today = new Date()
    const expiryDate = new Date(prescription.valid_until)
    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (!isOpen) return null

  const isDoctor = user?.role === 'doctor'
  const otherPerson = isDoctor ? prescription.patient : prescription.doctor
  const daysLeft = daysUntilExpiry()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Prescription Details</h2>
            <p className="text-gray-600 mt-1">
              {prescription.prescription_number} • {formatDate(prescription.created_at)}
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
          {/* Status & Validity */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Status</h3>
              <div className="flex items-center mt-1">
                {isExpired() ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Clock size={12} className="mr-1" />
                    Expired
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <FileText size={12} className="mr-1" />
                    Valid
                  </span>
                )}
              </div>
            </div>
            
            {prescription.valid_until && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Valid Until</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(prescription.valid_until)}
                </p>
                {daysLeft !== null && daysLeft > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {daysLeft} days remaining
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Doctor/Patient Info */}
          {otherPerson && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <span className="mr-2">📞</span>
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
                      <span className="mr-2">✉️</span>
                      <a 
                        href={`mailto:${otherPerson.email}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {otherPerson.email}
                      </a>
                    </div>
                  )}
                  {!isDoctor && prescription.doctor?.specialties?.[0] && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">🩺</span>
                      {prescription.doctor.specialties[0].main_specialty}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Prescription Details</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <FileText size={16} className="mr-2" />
                    {prescription.prescription_number}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    {formatDate(prescription.created_at)}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Pill size={16} className="mr-2" />
                    {prescription.medicines.length} medicine(s)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diagnosis */}
          {prescription.diagnosis && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Diagnosis</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">{prescription.diagnosis}</p>
                {prescription.diagnosis_ar && (
                  <p className="text-sm text-blue-800 mt-2 font-arabic" dir="rtl">
                    {prescription.diagnosis_ar}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Medicines */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Prescribed Medicines</h3>
            <div className="space-y-3">
              {prescription.medicines.map((medicine, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{medicine.name}</h4>
                      {medicine.name_ar && (
                        <p className="text-sm text-gray-600 font-arabic" dir="rtl">
                          {medicine.name_ar}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {medicine.dosage}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Frequency:</span> {medicine.frequency}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {medicine.duration}
                    </div>
                  </div>
                  
                  {medicine.instructions && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                      <span className="font-medium">Instructions:</span> {medicine.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* General Instructions */}
          {prescription.general_instructions && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">General Instructions</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-900">{prescription.general_instructions}</p>
                {prescription.general_instructions_ar && (
                  <p className="text-sm text-green-800 mt-2 font-arabic" dir="rtl">
                    {prescription.general_instructions_ar}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PrescriptionDetailsModal