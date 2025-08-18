import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

// Layouts
import PublicLayout from '@/layouts/PublicLayout'
import DashboardLayout from '@/layouts/DashboardLayout'

// Pages
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import VerifyOTP from '@/pages/auth/VerifyOTP'
import ForgotPassword from '@/pages/auth/ForgotPassword'

// Doctor Pages
import DoctorDashboard from '@/pages/doctor/Dashboard'
import DoctorProfile from '@/pages/doctor/Profile'
import DoctorAppointments from '@/pages/doctor/Appointments'
import DoctorPatients from '@/pages/doctor/Patients'
import DoctorPrescriptions from '@/pages/doctor/Prescriptions'

// Patient Pages
import PatientDashboard from '@/pages/patient/Dashboard'
import PatientProfile from '@/pages/patient/Profile'
import PatientAppointments from '@/pages/patient/Appointments'
import FindDoctors from '@/pages/patient/FindDoctors'

// Components
import PrivateRoute from '@/components/auth/PrivateRoute'
import DevModeBanner from '@/components/common/DevModeBanner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagProvider>
        <ThemeProvider>
          <Router> {/* ✅ Moved here */}
            <AuthProvider> {/* ✅ Now this is inside Router */}
              <DevModeBanner />
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify" element={<VerifyOTP />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>

                {/* Doctor Routes */}
                <Route
                  path="/doctor"
                  element={
                    <PrivateRoute requiredRole="doctor">
                      <DashboardLayout />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Navigate to="/doctor/dashboard" />} />
                  <Route path="dashboard" element={<DoctorDashboard />} />
                  <Route path="profile" element={<DoctorProfile />} />
                  <Route path="appointments" element={<DoctorAppointments />} />
                  <Route path="patients" element={<DoctorPatients />} />
                  <Route path="prescriptions" element={<DoctorPrescriptions />} />
                </Route>

                {/* Patient Routes */}
                <Route
                  path="/patient"
                  element={
                    <PrivateRoute requiredRole="patient">
                      <DashboardLayout />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Navigate to="/patient/dashboard" />} />
                  <Route path="dashboard" element={<PatientDashboard />} />
                  <Route path="profile" element={<PatientProfile />} />
                  <Route path="appointments" element={<PatientAppointments />} />
                  <Route path="find-doctors" element={<FindDoctors />} />
                </Route>

                {/* Default Route */}
                <Route path="/" element={<Navigate to="/login" />} />
              </Routes>

              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </AuthProvider>
          </Router>
        </ThemeProvider>
      </FeatureFlagProvider>
    </QueryClientProvider>
  )
}


export default App