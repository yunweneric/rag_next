'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/shared/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?error=missing-credentials')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login error:', error.message)
    redirect('/login?error=invalid-credentials')
  }

  revalidatePath('/', 'layout')
  redirect('/chat')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!email || !password || !username) {
    redirect('/login?error=missing-fields')
  }

  // Validate password strength
  if (password.length < 6) {
    redirect('/login?error=weak-password')
  }

  // Validate username format
  if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    redirect('/login?error=invalid-username')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        full_name: username,
      }
    }
  })

  if (error) {
    console.error('Signup error:', error.message)
    if (error.message.includes('already registered')) {
      redirect('/login?error=email-exists')
    }
    redirect('/login?error=signup-failed')
  }

  if (data.user) {
    // Redirect to OTP verification page
    redirect('/verify-otp?email=' + encodeURIComponent(email))
  }
}

export async function verifyOTP(formData: FormData) {
  const supabase = await createClient()

  const token = formData.get('token') as string
  const email = formData.get('email') as string

  if (!token || !email) {
    redirect('/verify-otp?error=missing-token')
  }

  const { error } = await supabase.auth.verifyOtp({
    token,
    type: 'email',
    email,
  })

  if (error) {
    console.error('OTP verification error:', error.message)
    redirect('/verify-otp?error=invalid-token')
  }

  revalidatePath('/', 'layout')
  redirect('/chat')
}

export async function resendOTP(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email) {
    redirect('/verify-otp?error=missing-email')
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    console.error('Resend OTP error:', error.message)
    redirect('/verify-otp?error=resend-failed')
  }

  redirect('/verify-otp?success=otp-resent&email=' + encodeURIComponent(email))
}
