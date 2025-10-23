import { NextRequest, NextResponse } from 'next/server'
import { ChatConversationService } from '@/lib/features/chat/data/services/chat-conversation-service'
import type { ConversationListResponse, CreateConversationRequest, CreateConversationResponse } from '@/lib/features/chat/data/types/chat-types'

export async function GET(request: NextRequest): Promise<NextResponse<ConversationListResponse>> {
  try {
    const conversationService = new ChatConversationService()
    const conversations = await conversationService.getConversationsByUserId('anonymous-user')

    // Transform to API response format
    const response: ConversationListResponse = {
      conversations: conversations.map(conv => ({
        id: conv.id!,
        title: conv.title || 'Untitled Conversation',
        created_at: conv.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: conv.updatedAt?.toISOString() || new Date().toISOString()
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { conversations: [] },
      { status: 500 }
    )
  }
}

// Add POST method for creating conversations
export async function POST(request: NextRequest): Promise<NextResponse<CreateConversationResponse>> {
  try {
    const body: CreateConversationRequest = await request.json()
    const { title } = body

    if (!title) {
      return NextResponse.json({ conversation: null as any }, { status: 400 })
    }

    const conversationService = new ChatConversationService()
    const conversation = await conversationService.createConversation('anonymous-user', title)

    if (!conversation) {
      return NextResponse.json({ conversation: null as any }, { status: 500 })
    }

    const response: CreateConversationResponse = { conversation }
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { conversation: null as any },
      { status: 500 }
    )
  }
}
