import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Eye, EyeOff, Mail, Phone, Lock, User, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useFeatureFlags } from '@/contexts/FeatureFlagContext'
import { UserRole, AuthMethod } from '@/types'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Card from '@/components/common/Card'
import Select from '@/components/common/Select'

const schema = yup.object({
  full_name: yup.string().required('Full name is required').min(2, 'Name too short'),
  email: yup.string().email('Invalid email').nullable(),
  phone_number: yup.string().nullable(),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain uppercase letter')
    .matches(/[a-z]/, 'Password must contain lowercase letter')
    .matches(/[0-9]/, 'Password must contain number'),
  confirmPassword: yup.string()
    .required('Please confirm password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  role: yup.string().oneOf(['doctor', 'patient']).required('Please select a role'),
})

type RegisterFormData = yup.InferType<typeof schema>

const Register: React.FC = () => {
  const { register: registerUser } = useAuth()
  const { flags } = useFeatureFlags()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>(
    flags.emailAuthEnabled ? 'email' : 'phone'
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      await registerUser({
        ...data,
        role: data.role as UserRole,
        country_code: '+963',
        auth_method: authMethod === 'email' ? AuthMethod.EMAIL : AuthMethod.PHONE,
      })
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Join DOME Care Healthcare Platform</p>
          
          {flags.mockMode && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Dev Mode:</strong> Email verification is automatic. OTP: 123456
              </p>
            </div>
          )}
        </div>

        {/* Auth Method Toggle */}
        {flags.phoneVerificationEnabled && flags.emailAuthEnabled && (
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                authMethod === 'email'
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <Mail className="inline-block mr-2" size={18} />
              Email
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                authMethod === 'phone'
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <Phone className="inline-block mr-2" size={18} />
              Phone
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="Enter your full name"
            icon={<User size={20} />}
            error={errors.full_name?.message}
            {...register('full_name')}
          />

          {authMethod === 'email' ? (
            <Input
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              icon={<Mail size={20} />}
              error={errors.email?.message}
              {...register('email')}
            />
          ) : (
            <Input
              label="Phone Number"
              type="tel"
              placeholder="9xxxxxxxx or 09xxxxxxxx"
              icon={<Phone size={20} />}
              error={errors.phone_number?.message}
              {...register('phone_number')}
              disabled={!flags.phoneVerificationEnabled}
            />
          )}

          <Select
            label="I am a"
            error={errors.role?.message}
            {...register('role')}
          >
            <option value="">Select role</option>
            <option value="doctor">Doctor</option>
            <option value="patient">Patient</option>
          </Select>

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              icon={<Lock size={20} />}
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              icon={<Lock size={20} />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              className="mt-1 rounded border-gray-300"
              required
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                Privacy Policy
              </Link>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
            icon={<UserPlus size={20} />}
          >
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Register