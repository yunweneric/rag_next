import type { Citation, ResponseMetrics, EnhancedSource, AssistantResponseV2 } from '@/lib/shared/types/llm-response'

// Base interfaces for database entities
export interface Conversation {
  id?: string
  userId: string
  title?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Message {
  id?: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  sources?: EnhancedSource[] | null
  citations?: Citation[] | null
  confidence?: number | null
  followUps?: string[] | null
  metrics?: ResponseMetrics | null
  responseVersion?: number
  createdAt?: Date
  updatedAt?: Date
}

// API request/response interfaces
export interface ChatMessageRequest {
  message: string
  conversationId?: string | null
}

export interface ChatMessageResponse {
  success: boolean
  data?: AssistantResponseV2
  conversationId?: string
  error?: string
}

export interface ConversationListResponse {
  conversations: ConversationListItem[]
}

export interface ConversationListItem {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ConversationMessagesResponse {
  messages: MessageListItem[]
}

export interface MessageListItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: EnhancedSource[]
  citations?: Citation[]
  follow_ups?: string[]
  metrics?: ResponseMetrics
  response_version?: number
  created_at: string
}

export interface CreateConversationRequest {
  title: string
}

export interface CreateConversationResponse {
  conversation: Conversation
}

// Re-export from shared types for convenience
export type { AssistantResponseV2, Citation, ResponseMetrics, EnhancedSource } from '@/lib/shared/types/llm-response'
