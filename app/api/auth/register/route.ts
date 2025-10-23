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
      full_name 
    })

    if (!response.success || !response.user) {
      console.error('Registration failed:', {
        success: response.success,
        user: response.user,
        error: response.error
      })
      return NextResponse.json(
        { error: response.error?.message || 'Registration failed' },
        { status: 400 }
      )
    }
    console.log('response', response)

    return NextResponse.json({
      success: true,
      user: response.user,
      token: response.token,
      refreshToken: response.refreshToken,
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
