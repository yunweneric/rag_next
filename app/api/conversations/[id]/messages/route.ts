import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/utils/supabase/server'
import { ChatConversationService } from '@/lib/features/chat/data/services/chat-conversation-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params
    const conversationService = new ChatConversationService()
    const messages = await conversationService.getMessagesByConversationId(conversationId)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
