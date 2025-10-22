import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/features/auth/data/services/auth-service'
import { registerSchema } from '@/lib/shared/validations'
import { validateRequestBody, isValidationSuccess } from '@/lib/shared/utils/validation'

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequestBody(request, registerSchema)
    if (!isValidationSuccess(validation)) {
      return validation
    }
    
    const { email, password, username, full_name } = validation.data

    const authService = new AuthService()
    const response = await authService.signup({
      email,
      password,
      username,
      full_name: full_name || username
    })

    if (!response.success || !response.user) {
      return NextResponse.json(
        { error: response.error?.message || 'Registration failed' },
        { status: 400 }
      )
    }

    // Get the JWT token from the current session
    const token = await authService.getAccessToken()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Registration successful but failed to get access token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: response.user,
      token: token,
      message: 'Registration successful'
    })

  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
