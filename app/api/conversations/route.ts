import { NextRequest, NextResponse } from 'next/server'
import { validateJWTToken } from '@/lib/shared/utils/auth/jwt-auth'
import { ChatConversationService } from '@/lib/features/chat/data/services/chat-conversation-service'
import { createConversationSchema } from '@/lib/shared/validations'
import { validateRequestBody, isValidationSuccess } from '@/lib/shared/utils/validation'

export async function GET(request: NextRequest) {
  try {
    // Check JWT token authentication
    const { user, accessToken, error: authError } = await validateJWTToken(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationService = new ChatConversationService(accessToken)
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

// Add POST method for creating conversations
export async function POST(request: NextRequest) {
  try {
    // Check JWT token authentication
    const { user, accessToken, error: authError } = await validateJWTToken(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const validation = await validateRequestBody(request, createConversationSchema)
    if (!isValidationSuccess(validation)) {
      return validation
    }
    
    const { title } = validation.data
    const conversationService = new ChatConversationService(accessToken)
    const conversation = await conversationService.createConversation(user.id, title)

    if (!conversation) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
