import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

export interface ValidationError {
  field: string
  message: string
}

export function validateRequest<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: ValidationError[] = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return { success: false, errors }
    }
    
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }]
    }
  }
}

export function createValidationErrorResponse(errors: ValidationError[]) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: errors
    },
    { status: 400 }
  )
}

export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ success: true; data: T } | NextResponse> {
  try {
    const body = await request.json()
    const validation = validateRequest(schema, body)
    
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }
    
    return { success: true, data: validation.data }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }
}

// Type guard to check if result is a validation success
export function isValidationSuccess<T>(
  result: { success: true; data: T } | NextResponse
): result is { success: true; data: T } {
  return 'success' in result && result.success === true
}

export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const params: Record<string, string> = {}
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = value
  }
  
  return validateRequest(schema, params)
}
