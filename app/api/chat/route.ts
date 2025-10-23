import { NextRequest, NextResponse } from 'next/server'
import { validateFirebaseToken } from '@/lib/shared/utils/auth/firebase-auth'
import { SwissLegalService } from '@/lib/features/chat/data/services/swiss-legal-service'
import { LawyerService } from '@/lib/features/chat/data/services/lawyer-service'
import { ChatConversationService } from '@/lib/features/chat/data/services/chat-conversation-service'
import { chatMessageSchema } from '@/lib/shared/validations'
import { validateRequestBody, isValidationSuccess } from '@/lib/shared/utils/validation'
import { StreamingResponse } from '@/lib/shared/utils/streaming'
import type { AssistantResponseV2 } from '@/lib/shared/types/llm-response'

export async function POST(request: NextRequest) {
  try {
    // Check Firebase token authentication
    const { user, error: authError } = await validateFirebaseToken(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request body
    const validation = await validateRequestBody(request, chatMessageSchema)
    if (!isValidationSuccess(validation)) {
      return validation
    }
    
    const { message, conversationId } = validation.data
    const bearer = request.headers.get('authorization')?.replace('Bearer ', '')

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
      const conversationService = new ChatConversationService()
      const conversation = await conversationService.createConversation(
        user.id,
        message.substring(0, 50) + (message.length > 50 ? '...' : '')
      )

      if (!conversation || !conversation.id) {
        console.error('Error creating conversation')
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }

      currentConversationId = conversation.id
    }

    // Save user message
    const conversationService = new ChatConversationService()
    await conversationService.addMessage({
      conversation_id: currentConversationId,
      role: 'user',
      content: message
    })

    // Create streaming response
    const stream = StreamingResponse.createStream(
      (token: string) => {
        // Token streaming callback - handled by the stream
      },
      async (data: AssistantResponseV2) => {
        // Complete response callback
        try {
          // Save AI response with v2 format
          await conversationService.addMessage({
            conversation_id: currentConversationId,
            role: 'assistant',
            content: data.message.textMd,
            sources: data.sources,
            confidence: data.metrics.confidence,
            citations: data.citations,
            follow_ups: data.followUps,
            metrics: data.metrics,
            response_version: 2
          })
        } catch (error) {
          console.error('Error saving AI response:', error)
        }
      },
      (error: string) => {
        console.error('Streaming error:', error)
      }
    )

    // Start the RAG query in the background
    setImmediate(async () => {
      try {
        const ragResponse = await legalService.query(message)
        
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

        // Simulate token streaming for now (in a real implementation, you'd stream from the LLM)
        const words = ragResponse.answer.split(' ')
        let currentText = ''
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i] + (i < words.length - 1 ? ' ' : '')
          currentText += word
          
          // Send token event
          if ((stream as any).onToken) {
            (stream as any).onToken(word)
          }
          
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        // Send metadata
        if ((stream as any).onMetadata) {
          (stream as any).onMetadata({
            sources: ragResponse.sources.slice(0, 2), // Preview first 2 sources
            confidence: ragResponse.confidence
          })
        }

        // Send complete response
        if ((stream as any).onComplete) {
          (stream as any).onComplete(responseV2)
        }
      } catch (error) {
        console.error('Error in RAG query:', error)
        if ((stream as any).onError) {
          (stream as any).onError('Failed to process your question. Please try again.')
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
