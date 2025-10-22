import { NextRequest, NextResponse } from 'next/server'
import { validateJWTToken } from '@/lib/shared/utils/auth/jwt-auth'
import { SwissLegalService } from '@/lib/features/chat/data/services/swiss-legal-service'
import { LawyerService } from '@/lib/features/chat/data/services/lawyer-service'
import { ChatConversationService } from '@/lib/features/chat/data/services/chat-conversation-service'
import { chatMessageSchema } from '@/lib/shared/validations'
import { validateRequestBody, isValidationSuccess } from '@/lib/shared/utils/validation'

export async function POST(request: NextRequest) {
  try {
    // Check JWT token authentication
    const { user, error: authError } = await validateJWTToken(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const validation = await validateRequestBody(request, chatMessageSchema)
    if (!isValidationSuccess(validation)) {
      return validation
    }
    
    const { message, conversationId } = validation.data

    // Initialize Swiss Legal Service (OpenAI)
    const legalService = new SwissLegalService({
      llmModel: process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini',
      embedModel: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
      pineconeApiKey: process.env.PINECONE_API_KEY || '',
      indexName: 'swiss-legal',
      domainKeywords: [],
      domainName: 'Swiss Legal System',
      documentPath: './public/docs/swiss_legal.pdf',
      chunkSize: 1200,
      chunkOverlap: 300
    })

    // Get or create conversation
    let currentConversationId = conversationId
    if (!currentConversationId) {
      const conversationService = new ChatConversationService()
      const conversation = await conversationService.createConversation(
        user.id,
        message.substring(0, 50) + (message.length > 50 ? '...' : '')
      )

      if (!conversation) {
        console.error('Error creating conversation')
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }

      currentConversationId = conversation.id
    }

    // Save user message and get conversation history
    const conversationService = new ChatConversationService()
    await conversationService.addMessage({
      conversation_id: currentConversationId,
      role: 'user',
      content: message
    })

    const messages = await conversationService.getMessagesByConversationId(currentConversationId)

    // Get AI response
    const ragResponse = await legalService.query(message)

    // Save AI response
    await conversationService.addMessage({
      conversation_id: currentConversationId,
      role: 'assistant',
      content: ragResponse.answer,
      sources: ragResponse.sources,
      confidence: ragResponse.confidence
    })

    // Check if we should recommend lawyers
    let shouldRecommendLawyers = false
    let lawyerRecommendations: any[] = []

    if (ragResponse.confidence > 0.7 && ragResponse.sources.length > 0) {
      // Get conversation history for lawyer recommendations
      const conversationHistory = messages?.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })) || []

      conversationHistory.push({ role: 'user', content: message })
      conversationHistory.push({ role: 'assistant', content: ragResponse.answer })

      const lawyerService = new LawyerService()
      lawyerRecommendations = await lawyerService.getRecommendations({
        conversationHistory,
        userQuestion: message
      })

      shouldRecommendLawyers = lawyerRecommendations.length > 0
    }

    return NextResponse.json({
      answer: ragResponse.answer,
      sources: ragResponse.sources,
      confidence: ragResponse.confidence,
      processingTime: ragResponse.processingTime,
      conversationId: currentConversationId,
      shouldRecommendLawyers,
      lawyerRecommendations
    })

  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
