import React, { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Shield, RefreshCw } from 'lucide-react'
import authService from '@/services/authService'
import { useFeatureFlags } from '@/contexts/FeatureFlagContext'
import Button from '@/components/common/Button'
import Card from '@/components/common/Card'
import toast from 'react-hot-toast'

const VerifyOTP: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { flags } = useFeatureFlags()
  const { identifier, isEmail } = location.state || {}
  
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!identifier) {
      navigate('/register')
    }
  }, [identifier, navigate])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value

    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    const newOtp = [...otp]
    
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) {
        newOtp[i] = pastedData[i]
      }
    }
    
    setOtp(newOtp)
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      toast.error('Please enter a complete OTP')
      return
    }

    setIsLoading(true)
    try {
      await authService.verifyOTP({ identifier, otp: otpCode })
      toast.success('Verification successful!')
      navigate('/login')
    } catch (error) {
      console.error('Verification error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return

    try {
      await authService.resendOTP(identifier)
      toast.success('OTP resent successfully')
      setResendTimer(120) // 2 minutes
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (error) {
      console.error('Resend error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="text-primary-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Verify Your Account</h1>
          <p className="text-gray-600 mt-2">
            We've sent a verification code to {isEmail ? 'your email' : 'your phone'}
          </p>
          <p className="text-sm text-gray-500 mt-1">{identifier}</p>
          
          {flags.mockMode && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Dev Mode:</strong> Use OTP: <code className="font-mono">123456</code>
              </p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Enter verification code
            </label>
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={isLoading}
          >
            Verify Account
          </Button>

          <div className="text-center">
            {resendTimer > 0 ? (
              <p className="text-sm text-gray-500">
                Resend code in {Math.floor(resendTimer / 60)}:{(resendTimer % 60).toString().padStart(2, '0')}
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center"
              >
                <RefreshCw size={16} className="mr-1" />
                Resend Code
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}

export default VerifyOTP