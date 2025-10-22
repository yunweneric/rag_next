import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/features/auth/data/services/auth-service'
import { loginSchema } from '@/lib/shared/validations'
import { validateRequestBody, isValidationSuccess } from '@/lib/shared/utils/validation'

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequestBody(request, loginSchema)
    if (!isValidationSuccess(validation)) {
      return validation
    }
    
    const { email, password } = validation.data

    const authService = new AuthService()
    const response = await authService.login({ email, password })

    if (!response.success || !response.user) {
      return NextResponse.json(
        { error: response.error?.message || 'Login failed' },
        { status: 401 }
      )
    }

    // Get the JWT token from the current session
    const token = await authService.getAccessToken()
    
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to get access token' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: response.user,
      token: token,
      message: 'Login successful'
    })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
