import { Suspense } from 'react'
import { OTPVerificationForm } from '../components/otp-verification-form'

export default function OTPVerificationPage() {
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center">Loading...</div>}>
      <OTPVerificationForm />
    </Suspense>
  )
}
