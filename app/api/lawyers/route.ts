import { NextRequest, NextResponse } from 'next/server'
import { LawyerService } from '@/lib/features/chat/data/services/lawyer-service'
import { lawyerSearchSchema } from '@/lib/shared/validations'
import { validateQueryParams, createValidationErrorResponse } from '@/lib/shared/utils/validation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = validateQueryParams(searchParams, lawyerSearchSchema)
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors)
    }
    
    const { q: query } = validation.data
    
    const lawyerService = new LawyerService()
    const lawyers = await lawyerService.getAllLawyers()
    
    // Filter lawyers based on query if provided
    const filteredLawyers = query 
      ? lawyers.filter(lawyer => 
          lawyer.name.toLowerCase().includes(query.toLowerCase()) ||
          lawyer.specialties.some(specialty => 
            specialty.toLowerCase().includes(query.toLowerCase())
          )
        )
      : lawyers
    
    return NextResponse.json({ lawyers: filteredLawyers })
  } catch (error) {
    console.error('Error fetching lawyers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}