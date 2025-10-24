import { NextRequest, NextResponse } from 'next/server'
import { SwissLegalService } from '@/lib/features/chat/data/services/swiss-legal-service'
import { ChatConversationService } from '@/lib/features/chat/data/services/chat-conversation-service'
import type { AssistantResponseV2 } from '@/lib/shared/types/llm-response'
import type { ChatMessageRequest, ChatMessageResponse } from '@/lib/features/chat/data/types/chat-types'

export async function POST(request: NextRequest): Promise<NextResponse<ChatMessageResponse>> {
  try {
    // Parse request body directly
    const body: ChatMessageRequest = await request.json()
    const { message, conversationId } = body

    // Add debugging to track conversation ID flow
    console.log('Received request:', { 
      hasMessage: !!message, 
      conversationId, 
      conversationIdType: typeof conversationId 
    })

    if (!message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message is required' 
      }, { status: 400 })
    }

    // Initialize Swiss Legal Service (OpenAI)
    const legalService = new SwissLegalService({
      llmModel: process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini',
      embedModel: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
      pineconeApiKey: process.env.PINECONE_API_KEY || '',
      indexName: process.env.PINECONE_INDEX || 'swiss-legal-openai-1536',
      domainKeywords: [],
      domainName: 'Swiss Legal System',
      documentPath: './public/docs/swiss_legal.pdf',
      chunkSize: 1200,
      chunkOverlap: 300
    })

    // Get or create conversation
    let currentConversationId = conversationId
    if (!currentConversationId) {
      console.log('Creating new conversation - conversationId was:', conversationId)
      const conversationService = new ChatConversationService()
      const conversation = await conversationService.createConversation(
        'anonymous-user', // Use anonymous user for now
        message.substring(0, 50) + (message.length > 50 ? '...' : '')
      )

      if (!conversation || !conversation.id) {
        console.error('Error creating conversation')
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create conversation' 
        }, { status: 500 })
      }

      currentConversationId = conversation.id
    }
    
    console.log('Using conversationId:', currentConversationId)

    // Fetch conversation messages BEFORE saving the current message
    let conversationMessages: any[] = []
    const conversationService = new ChatConversationService()
    if (currentConversationId) {
      try {
        const messagesResponse = await conversationService.getMessagesByConversationId(currentConversationId)
        if (messagesResponse && Array.isArray(messagesResponse)) {
          // Sort by createdAt (most recent first) and limit to 10 messages
          conversationMessages = messagesResponse
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
              return dateB - dateA
            })
            .slice(0, 10)
        }
      } catch (error) {
        console.warn('Failed to fetch conversation messages:', error)
        // Continue without conversation context
      }
    }

    // Save user message
    await conversationService.addMessage({
      conversation_id: currentConversationId,
      role: 'user',
      content: message
    })

    console.log('Conversation messages:', conversationMessages.length)
    console.log('Conversation messages:', conversationMessages)

    // Process the RAG query
    try {
      const ragResponse = await legalService.query(message, conversationMessages)
      
      // Convert RAG response to AssistantResponseV2 format
      const responseV2: AssistantResponseV2 = {
        status: 'complete',
        message: {
          textMd: ragResponse.answer
        },
        citations: ragResponse.citations,
        sources: ragResponse.sources,
        followUps: ragResponse.followUps,
        metrics: ragResponse.metrics
      }

      // Save AI response with v2 format
      await conversationService.addMessage({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: responseV2.message.textMd,
        sources: responseV2.sources,
        confidence: responseV2.metrics.confidence,
        citations: responseV2.citations,
        follow_ups: responseV2.followUps,
        metrics: responseV2.metrics,
        response_version: 2
      })

      // Return the response with proper typing
      const response: ChatMessageResponse = {
        success: true,
        data: responseV2,
        conversationId: currentConversationId
      }
      return NextResponse.json(response)

    } catch (ragError) {
      console.error('Error in RAG query:', ragError)
      const errorResponse: ChatMessageResponse = {
        success: false,
        error: 'Failed to process your question. Please try again.',
        conversationId: currentConversationId
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

  } catch (error) {
    console.error('Error in chat API:', error)
    const errorResponse: ChatMessageResponse = {
      success: false,
      error: 'Internal server error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
