import { z } from 'zod'

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

// Register validation schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be less than 100 characters').optional()
})

// OTP verification schema
export const otpVerificationSchema = z.object({
  token: z.string().min(6, 'OTP token must be at least 6 characters'),
  email: z.string().email('Invalid email format'),
  type: z.enum(['email', 'sms'], { required_error: 'Type must be either email or sms' })
})

// Resend OTP schema
export const resendOtpSchema = z.object({
  email: z.string().email('Invalid email format'),
  type: z.enum(['signup', 'recovery']).optional().default('signup')
})

// Profile update schema
export const profileUpdateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters').optional(),
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name must be less than 100 characters').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional()
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>
export type ResendOtpInput = z.infer<typeof resendOtpSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
