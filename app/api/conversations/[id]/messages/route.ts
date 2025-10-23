import { NextRequest, NextResponse } from 'next/server'
import { validateFirebaseToken } from '@/lib/shared/utils/auth/firebase-auth'
import { ChatConversationService } from '@/lib/features/chat/data/services/chat-conversation-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check Firebase token authentication
    const { user, error: authError } = await validateFirebaseToken(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: conversationId } = await params
    const conversationService = new ChatConversationService()
    const messages = await conversationService.getMessagesByConversationId(conversationId)

    return NextResponse.json({ 
      messages: messages.map(msg => ({
        ...msg,
        citations: msg.citations || [],
        follow_ups: msg.followUps || [],
        metrics: msg.metrics || {},
        response_version: msg.responseVersion || 1
      }))
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
