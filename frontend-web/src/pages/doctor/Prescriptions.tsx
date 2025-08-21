import React, { useState } from 'react'
import { Plus, Search, FileText, User, Calendar } from 'lucide-react'
import { useQuery } from 'react-query'
import { prescriptionService } from '@/services'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import LoadingScreen from '@/components/common/LoadingScreen'
import CreatePrescriptionModal from '@/components/prescriptions/CreatePrescriptionModal'
import PrescriptionDetailsModal from '@/components/prescriptions/PrescriptionDetailsModal'
import toast from 'react-hot-toast'

interface Prescription {
  _id: string
  prescription_number: string
  patient: {
    full_name: string
    phone_number?: string
  }
  diagnosis?: string
  medicines: Array<{
    name: string
    dosage: string
    frequency: string
    duration: string
  }>
  created_at: string
  valid_until?: string
}

const DoctorPrescriptions: React.FC = () => {
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const { data: prescriptionsData, isLoading, refetch } = useQuery(
    ['doctor-prescriptions', page],
    () => prescriptionService.getMyPrescriptions(page, 10),
    {
      onError: () => {
        toast.error('Failed to fetch prescriptions')
      }
    }
  )

  const { data: statsData } = useQuery(
    ['prescription-stats'],
    () => prescriptionService.getStats()
  )

  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setShowDetailsModal(true)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading && !prescriptionsData) {
    return <LoadingScreen />
  }

  const prescriptions = prescriptionsData?.data?.prescriptions || []
  const stats = statsData?.data || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Prescriptions</h1>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus size={20} />}
        >
          New Prescription
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.today || 0}
              </p>
            </div>
            <FileText className="text-primary-600" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.week || 0}
              </p>
            </div>
            <Calendar className="text-secondary-600" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.month || 0}
              </p>
            </div>
            <FileText className="text-purple-600" size={24} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total || 0}
              </p>
            </div>
            <FileText className="text-orange-600" size={24} />
          </div>
        </Card>
      </div>

      {/* Prescriptions List */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Prescriptions</h3>
        </div>

        {prescriptions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 text-lg">No prescriptions created yet</p>
            <p className="text-gray-500 mt-2">Create your first prescription to get started</p>
            <Button
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={20} />}
            >
              Create Prescription
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {prescriptions.map((prescription: Prescription) => (
              <PrescriptionCard
                key={prescription._id}
                prescription={prescription}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {prescriptionsData?.data?.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-center items-center space-x-4">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-gray-600">
                Page {page} of {prescriptionsData.data.pages}
              </span>
              <Button
                variant="outline"
                disabled={page === prescriptionsData.data.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Prescription Modal */}
      {showCreateModal && (
        <CreatePrescriptionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            refetch()
          }}
        />
      )}

      {/* Prescription Details Modal */}
      {showDetailsModal && selectedPrescription && (
        <PrescriptionDetailsModal
          prescription={selectedPrescription}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedPrescription(null)
          }}
        />
      )}
    </div>
  )
}

// Prescription Card Component
interface PrescriptionCardProps {
  prescription: Prescription
  onViewDetails: (prescription: Prescription) => void
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  onViewDetails
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="px-6 py-4 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-sm font-medium text-gray-900">
              {prescription.prescription_number}
            </h4>
            <span className="text-xs text-gray-500">
              {formatDate(prescription.created_at)}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
            <span className="flex items-center">
              <User size={16} className="mr-1" />
              {prescription.patient.full_name}
            </span>
            <span>
              {prescription.medicines.length} medicine(s)
            </span>
          </div>

          {prescription.diagnosis && (
            <p className="text-sm text-gray-600 line-clamp-1">
              <strong>Diagnosis:</strong> {prescription.diagnosis}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(prescription)}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DoctorPrescriptions