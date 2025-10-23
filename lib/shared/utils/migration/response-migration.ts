import type { EnhancedSource, Citation, ResponseMetrics } from '@/lib/shared/types/llm-response'

export interface LegacyMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{
    content: string
    page: number
    section?: string
    score: number
  }>
  confidence?: number
  lawyerRecommendations?: any[]
}

export interface MessageV2 {
  role: 'user' | 'assistant'
  content: string
  sources?: EnhancedSource[]
  confidence?: number
  citations?: Citation[]
  followUps?: string[]
  metrics?: ResponseMetrics
  lawyerRecommendations?: any[]
  responseVersion?: number
}

export function enhanceSource(legacySource: any): EnhancedSource {
  const page = legacySource.page || 0
  const content = legacySource.content || ''
  
  // Create stable ID based on content hash and page
  const contentHash = hashString(content.slice(0, 100))
  const id = `pdf:${page}:${contentHash}`
  
  return {
    id,
    title: `Swiss Legal Code – Page ${page}`,
    page,
    url: `/docs/swiss_legal.pdf#page=${page}`,
    snippet: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
    score: legacySource.score || 0.5
  }
}

export function migrateMessageToV2(legacyMessage: LegacyMessage): MessageV2 {
  const enhancedSources = legacyMessage.sources?.map(enhanceSource) || []
  
  return {
    ...legacyMessage,
    sources: enhancedSources,
    citations: [], // Legacy messages don't have citations
    followUps: [], // Legacy messages don't have follow-ups
    metrics: {
      confidence: legacyMessage.confidence || 0,
      processingTime: 0, // Unknown for legacy messages
      tokenUsage: { prompt: 0, completion: 0, total: 0 }
    },
    responseVersion: 2
  }
}

export function isLegacyMessage(message: any): boolean {
  return !message.responseVersion || message.responseVersion === 1
}

// Helper function to create a simple hash of a string
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}
