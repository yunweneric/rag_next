import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/utils/supabase/server'
import { LawyerService } from '@/lib/features/chat/data/services/lawyer-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const lawyerService = new LawyerService()

    let lawyers
    if (category) {
      lawyers = await lawyerService.getLawyersBySpecialty(category)
    } else {
      lawyers = await lawyerService.getAllLawyers()
    }

    return NextResponse.json({ lawyers })

  } catch (error) {
    console.error('Error in lawyers API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { conversationHistory, userQuestion } = body

    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return NextResponse.json({ error: 'Invalid conversation history' }, { status: 400 })
    }

    const lawyerService = new LawyerService()
    const recommendations = await lawyerService.getRecommendations({
      conversationHistory,
      userQuestion
    })

    return NextResponse.json({ recommendations })

  } catch (error) {
    console.error('Error in lawyer recommendations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
