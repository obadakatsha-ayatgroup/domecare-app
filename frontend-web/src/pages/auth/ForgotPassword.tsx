import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Mail, ArrowLeft } from 'lucide-react'
import authService from '@/services/authService'
import { useFeatureFlags } from '@/contexts/FeatureFlagContext'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Card from '@/components/common/Card'
import toast from 'react-hot-toast'

const schema = yup.object({
  identifier: yup.string().required('Email or phone number is required'),
})

type ForgotPasswordFormData = yup.InferType<typeof schema>

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate()
  const { flags } = useFeatureFlags()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(schema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data.identifier)
      setIsSubmitted(true)
      toast.success('Password reset instructions sent!')
      
      // In dev mode, redirect to OTP verification
      if (flags.mockMode) {
        setTimeout(() => {
          navigate('/verify', { 
            state: { 
              identifier: data.identifier,
              isEmail: data.identifier.includes('@')
            } 
          })
        }, 2000)
      }
    } catch (error) {
      console.error('Forgot password error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="text-green-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
            <p className="text-gray-600 mt-2">
              We've sent password reset instructions to your email address.
            </p>
            {flags.mockMode && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Dev Mode:</strong> Redirecting to OTP verification...
                </p>
              </div>
            )}
          </div>
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to Login
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <div className="mb-8">
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to login
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="text-gray-600 mt-2">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
          
          {flags.mockMode && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Dev Mode:</strong> Password reset will use mock OTP: 123456
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Email or Phone Number"
            type="text"
            placeholder={flags.emailAuthEnabled ? "Enter your email" : "Enter your phone number"}
            icon={<Mail size={20} />}
            error={errors.identifier?.message}
            {...register('identifier')}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
          >
            Send Reset Instructions
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default ForgotPassword