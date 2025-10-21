import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/utils/supabase/server'
import { ChatConversationService } from '@/lib/features/chat/data/services/chat-conversation-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationService = new ChatConversationService()
    const conversations = await conversationService.getConversationsByUserId(user.id)

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
