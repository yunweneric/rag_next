import { NextRequest, NextResponse } from 'next/server'
import { ChatConversationService } from '@/lib/features/chat/data/services/chat-conversation-service'
import type { ConversationMessagesResponse } from '@/lib/features/chat/data/types/chat-types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ConversationMessagesResponse>> {
  try {
    const { id: conversationId } = await params
    const conversationService = new ChatConversationService()
    const messages = await conversationService.getMessagesByConversationId(conversationId)

    // Transform to API response format
    const response: ConversationMessagesResponse = {
      messages: messages.map(msg => ({
        id: msg.id!,
        role: msg.role,
        content: msg.content,
        sources: msg.sources || [],
        citations: msg.citations || [],
        follow_ups: msg.followUps || [],
        metrics: msg.metrics || { confidence: 0, processingTime: 0 },
        response_version: msg.responseVersion || 1,
        created_at: msg.createdAt?.toISOString() || new Date().toISOString()
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { messages: [] },
      { status: 500 }
    )
  }
}
