'use client'

import { verifyOTP, resendOTP } from '../../data/actions/auth-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Scale, Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../hooks/use-auth'

export function OTPVerificationForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const success = searchParams.get('success')
  const [isResending, setIsResending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    // Get email from Supabase auth state
    if (user?.email) {
      setEmail(user.email)
    }
  }, [user])

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'missing-token':
        return 'Please enter the verification code.'
      case 'invalid-token':
        return 'Invalid verification code. Please try again.'
      case 'missing-email':
        return 'Email address is missing.'
      case 'resend-failed':
        return 'Failed to resend verification code. Please try again.'
      default:
        return null
    }
  }

  const getSuccessMessage = (successCode: string) => {
    switch (successCode) {
      case 'otp-resent':
        return 'Verification code has been resent to your email.'
      default:
        return null
    }
  }

  const errorMessage = error ? getErrorMessage(error) : null
  const successMessage = success ? getSuccessMessage(success) : null

  const handleResend = async () => {
    if (!email) return
    
    setIsResending(true)
    const formData = new FormData()
    formData.append('email', email)
    
    try {
      await resendOTP(formData)
    } catch (error) {
      console.error('Error resending OTP:', error)
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a href="#" className="flex items-center gap-2 self-center font-medium">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Scale className="size-5" />
            </div>
            <span className="text-xl font-semibold">Swiss Legal</span>
          </a>
          
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                  <p>Email address is required for verification.</p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Logo and Brand */}
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Scale className="size-5" />
          </div>
          <span className="text-xl font-semibold">Swiss Legal</span>
        </a>

        {/* Main Verification Card */}
        <Card className="w-full">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
                <Mail className="size-6" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-semibold">
              Verify your email
            </CardTitle>
            <p className="text-sm text-secondary-foreground text-center">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-sm font-medium text-center text-primary">
              {email}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}
            
            <form className="space-y-4" action={async (formData) => {
              if (!email) return
              
              setIsLoading(true)
              formData.append('email', email)
              
              try {
                await verifyOTP(formData)
              } catch (error) {
                console.error('OTP verification error:', error)
              } finally {
                setIsLoading(false)
              }
            }}>
              <div className="space-y-2">
                <label htmlFor="token" className="text-sm font-medium">
                  Verification Code
                </label>
                <Input 
                  id="token" 
                  name="token" 
                  type="text" 
                  required 
                  placeholder="000000" 
                  maxLength={6}
                  className="h-11 text-center text-lg font-mono tracking-widest"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>
              
              <Button 
                type="submit"
                className="w-full h-11"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </Button>
            </form>
            
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Didn't receive the code?
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full"
                >
                  {isResending ? 'Resending...' : 'Resend Code'}
                </Button>
                
                <button
                  type="button"
                  onClick={() => window.location.href = '/login'}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ArrowLeft className="size-4" />
                  Back to Login
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}