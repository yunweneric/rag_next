import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/features/auth/data/services/auth-service'
import { z } from 'zod'
import { validateRequestBody, isValidationSuccess } from '@/lib/shared/utils/validation'

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequestBody(request, refreshTokenSchema)
    if (!isValidationSuccess(validation)) {
      return validation
    }
    
    const { refreshToken } = validation.data

    const authService = new AuthService()
    const response = await authService.refreshAccessToken(refreshToken)

    if (response.error) {
      return NextResponse.json(
        { error: response.error },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      token: response.token,
      refreshToken: response.refreshToken,
      message: 'Token refreshed successfully'
    })

  } catch (error) {
    console.error('Token refresh API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
