import React, { useState } from 'react'
import { Search, MapPin, Star, Clock, Calendar, Phone, DollarSign } from 'lucide-react'
import { useQuery } from 'react-query'
import { doctorService } from '@/services'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Card from '@/components/common/Card'
import LoadingScreen from '@/components/common/LoadingScreen'
import BookAppointmentModal from '@/components/appointments/BookAppointmentModal'
import toast from 'react-hot-toast'

interface Doctor {
  _id: string
  full_name: string
  specialties: Array<{
    main_specialty: string
    sub_specialty?: string
  }>
  bio?: string
  years_of_experience?: number
  rating?: number
  reviews_count: number
  clinic_info?: {
    city?: string
    area?: string
    consultation_fee?: number
    currency: string
    clinic_phone?: string
  }
}

interface SearchFilters {
  name: string
  specialty: string
  city: string
  min_rating: string
  max_fee: string
}

const FindDoctors: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({
    name: '',
    specialty: '',
    city: '',
    min_rating: '',
    max_fee: ''
  })
  const [page, setPage] = useState(1)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)

  // Fetch doctors based on filters
  const { data: searchResults, isLoading, refetch } = useQuery(
    ['doctors', filters, page],
    () => doctorService.searchDoctors({ ...filters, page }),
    {
      keepPreviousData: true
    }
  )

  // Fetch specialties for filter dropdown
  const { data: specialties } = useQuery(
    ['specialties'],
    () => doctorService.getSpecialties()
  )

  // Fetch cities for filter dropdown
  const { data: cities } = useQuery(
    ['cities'],
    () => doctorService.getCities()
  )

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filters change
  }

  const handleSearch = () => {
    refetch()
  }

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setShowBookingModal(true)
  }

  const clearFilters = () => {
    setFilters({
      name: '',
      specialty: '',
      city: '',
      min_rating: '',
      max_fee: ''
    })
    setPage(1)
  }

  if (isLoading && !searchResults) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Find Doctors</h1>
        <p className="text-gray-600">
          {searchResults?.data?.total || 0} doctors available
        </p>
      </div>

      {/* Search Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <Input
            placeholder="Search by doctor name"
            value={filters.name}
            onChange={(e) => handleFilterChange('name', e.target.value)}
            icon={<Search size={20} />}
          />
          
          <Select
            value={filters.specialty}
            onChange={(e) => handleFilterChange('specialty', e.target.value)}
          >
            <option value="">All Specialties</option>
            {specialties?.data?.map((specialty: string) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </Select>

          <Select
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
          >
            <option value="">All Cities</option>
            {cities?.data?.map((city: string) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>

          <Select
            value={filters.min_rating}
            onChange={(e) => handleFilterChange('min_rating', e.target.value)}
          >
            <option value="">Any Rating</option>
            <option value="4">4+ Stars</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="5">5 Stars</option>
          </Select>

          <Input
            type="number"
            placeholder="Max consultation fee"
            value={filters.max_fee}
            onChange={(e) => handleFilterChange('max_fee', e.target.value)}
            icon={<DollarSign size={20} />}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSearch} icon={<Search size={20} />}>
            Search
          </Button>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Search Results */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Searching...</p>
        </div>
      ) : searchResults?.data?.doctors?.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-600 text-lg">No doctors found matching your criteria</p>
          <p className="text-gray-500 mt-2">Try adjusting your search filters</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {searchResults?.data?.doctors?.map((doctor: Doctor) => (
            <DoctorCard
              key={doctor._id}
              doctor={doctor}
              onBook={() => handleBookAppointment(doctor)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {searchResults?.data?.pages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-gray-600">
            Page {page} of {searchResults.data.pages}
          </span>
          <Button
            variant="outline"
            disabled={page === searchResults.data.pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedDoctor && (
        <BookAppointmentModal
          doctor={selectedDoctor}
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false)
            setSelectedDoctor(null)
          }}
        />
      )}
    </div>
  )
}

// Doctor Card Component
interface DoctorCardProps {
  doctor: Doctor
  onBook: () => void
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBook }) => {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {doctor.full_name}
          </h3>
          
          {doctor.specialties?.[0] && (
            <p className="text-primary-600 font-medium mb-2">
              {doctor.specialties[0].main_specialty}
              {doctor.specialties[0].sub_specialty && 
                ` - ${doctor.specialties[0].sub_specialty}`
              }
            </p>
          )}

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            {doctor.years_of_experience && (
              <span className="flex items-center">
                <Clock size={16} className="mr-1" />
                {doctor.years_of_experience} years exp.
              </span>
            )}
            
            {doctor.rating && (
              <span className="flex items-center">
                <Star size={16} className="mr-1 text-yellow-400" />
                {doctor.rating.toFixed(1)} ({doctor.reviews_count} reviews)
              </span>
            )}
          </div>

          {doctor.clinic_info?.city && (
            <p className="flex items-center text-sm text-gray-600 mb-3">
              <MapPin size={16} className="mr-1" />
              {doctor.clinic_info.city}
              {doctor.clinic_info.area && `, ${doctor.clinic_info.area}`}
            </p>
          )}

          {doctor.clinic_info?.consultation_fee && (
            <p className="text-sm font-medium text-gray-900 mb-3">
              Consultation Fee: {doctor.clinic_info.consultation_fee} {doctor.clinic_info.currency}
            </p>
          )}

          {doctor.bio && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
              {doctor.bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {doctor.clinic_info?.clinic_phone && (
            <Button
              variant="outline"
              size="sm"
              icon={<Phone size={16} />}
              onClick={() => window.open(`tel:${doctor.clinic_info?.clinic_phone}`)}
            >
              Call
            </Button>
          )}
        </div>
        
        <Button
          onClick={onBook}
          icon={<Calendar size={16} />}
          size="sm"
        >
          Book Appointment
        </Button>
      </div>
    </Card>
  )
}

export default FindDoctors