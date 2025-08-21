import React, { useState, useEffect } from 'react'
import { X, Plus, Minus, Search } from 'lucide-react'
import { useQuery } from 'react-query'
import { prescriptionService, doctorService } from '@/services'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import toast from 'react-hot-toast'

interface Medicine {
  name: string
  name_ar?: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

interface Patient {
  _id: string
  full_name: string
  phone_number?: string
}

interface CreatePrescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  patientId?: string // If coming from patient context
  appointmentId?: string // If coming from appointment context
}

const CreatePrescriptionModal: React.FC<CreatePrescriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  patientId,
  appointmentId
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '')
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ])
  const [generalInstructions, setGeneralInstructions] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [medicineSearch, setMedicineSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Get default valid until date (30 days from now)
  useEffect(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    setValidUntil(date.toISOString().split('T')[0])
  }, [])

  // Search medicines
  const { data: medicineResults } = useQuery(
    ['medicine-search', medicineSearch],
    () => prescriptionService.searchMedicines(medicineSearch, 10),
    {
      enabled: medicineSearch.length >= 2,
      onSuccess: (data) => {
        setSearchResults(data.data || [])
      }
    }
  )

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ])
  }

  const removeMedicine = (index: number) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index))
    }
  }

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const updated = medicines.map((medicine, i) => 
      i === index ? { ...medicine, [field]: value } : medicine
    )
    setMedicines(updated)
  }

  const selectMedicine = (index: number, selectedMedicine: any) => {
    updateMedicine(index, 'name', selectedMedicine.name)
    setMedicineSearch('')
    setSearchResults([])
  }

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient')
      return
    }

    if (!diagnosis.trim()) {
      toast.error('Please enter a diagnosis')
      return
    }

    if (medicines.length === 0 || !medicines[0].name.trim()) {
      toast.error('Please add at least one medicine')
      return
    }

    // Validate medicines
    for (let i = 0; i < medicines.length; i++) {
      const medicine = medicines[i]
      if (!medicine.name.trim() || !medicine.dosage.trim() || !medicine.frequency.trim() || !medicine.duration.trim()) {
        toast.error(`Please complete all fields for medicine ${i + 1}`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      const prescriptionData = {
        patient_id: selectedPatientId,
        appointment_id: appointmentId,
        diagnosis,
        medicines: medicines.filter(m => m.name.trim()),
        general_instructions: generalInstructions,
        valid_until: validUntil
      }

      await prescriptionService.createPrescription(prescriptionData)
      toast.success('Prescription created successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to create prescription')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Prescription</h2>
            <p className="text-gray-600 mt-1">Add a new prescription for your patient</p>
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
          {/* Patient Selection (if not pre-selected) */}
          {!patientId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient *
              </label>
              <div className="relative">
                <Input
                  placeholder="Search patient by name..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  icon={<Search size={20} />}
                />
                {/* Patient search results would go here */}
              </div>
            </div>
          )}

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis *
            </label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter patient diagnosis..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                Medicines *
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={addMedicine}
                icon={<Plus size={16} />}
              >
                Add Medicine
              </Button>
            </div>

            <div className="space-y-4">
              {medicines.map((medicine, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Medicine {index + 1}
                    </span>
                    {medicines.length > 1 && (
                      <button
                        onClick={() => removeMedicine(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Input
                        label="Medicine Name"
                        placeholder="Search medicine..."
                        value={medicine.name}
                        onChange={(e) => {
                          updateMedicine(index, 'name', e.target.value)
                          setMedicineSearch(e.target.value)
                        }}
                      />
                      
                      {/* Medicine search results */}
                      {medicineSearch === medicine.name && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                          {searchResults.map((result, i) => (
                            <button
                              key={i}
                              onClick={() => selectMedicine(index, result)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium">{result.name}</div>
                              {result.name_ar && (
                                <div className="text-sm text-gray-600">{result.name_ar}</div>
                              )}
                              <div className="text-xs text-gray-500">
                                Available: {result.dosage_forms?.join(', ')}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Input
                      label="Dosage"
                      placeholder="e.g., 500mg"
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                    />

                    <Select
                      label="Frequency"
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                    >
                      <option value="">Select frequency</option>
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="Three times daily">Three times daily</option>
                      <option value="Four times daily">Four times daily</option>
                      <option value="Every 4 hours">Every 4 hours</option>
                      <option value="Every 6 hours">Every 6 hours</option>
                      <option value="Every 8 hours">Every 8 hours</option>
                      <option value="Every 12 hours">Every 12 hours</option>
                      <option value="As needed">As needed</option>
                    </Select>

                    <Select
                      label="Duration"
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                    >
                      <option value="">Select duration</option>
                      <option value="3 days">3 days</option>
                      <option value="5 days">5 days</option>
                      <option value="7 days">7 days</option>
                      <option value="10 days">10 days</option>
                      <option value="14 days">14 days</option>
                      <option value="1 month">1 month</option>
                      <option value="Until finished">Until finished</option>
                      <option value="As directed">As directed</option>
                    </Select>
                  </div>

                  <div className="mt-3">
                    <Input
                      label="Special Instructions (Optional)"
                      placeholder="e.g., Take after meals, Avoid alcohol"
                      value={medicine.instructions}
                      onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Instructions (Optional)
            </label>
            <textarea
              value={generalInstructions}
              onChange={(e) => setGeneralInstructions(e.target.value)}
              placeholder="General instructions for the patient..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Valid Until */}
          <div>
            <Input
              type="date"
              label="Valid Until"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!selectedPatientId || !diagnosis.trim() || !medicines[0]?.name.trim()}
          >
            Create Prescription
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreatePrescriptionModal