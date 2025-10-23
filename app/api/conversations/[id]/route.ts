import { NextRequest, NextResponse } from 'next/server'
import { ChatConversationService } from '@/lib/features/chat/data/services/chat-conversation-service'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const conversationService = new ChatConversationService()
    const success = await conversationService.deleteConversation(conversationId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
