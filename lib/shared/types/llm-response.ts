export type AssistantResponseV2 = {
  status: 'partial' | 'complete' | 'error'
  message: {
    textMd: string
    summary?: string
    blocks?: MessageBlock[]
  }
  citations: Citation[]
  sources: EnhancedSource[]
  followUps: string[]
  metrics: ResponseMetrics
  safety?: SafetyInfo
}

export type MessageBlock = 
  | { type: 'paragraph'; md: string }
  | { type: 'quote'; md: string; sourceId?: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; kind: 'info' | 'warning' | 'success'; md: string }
  | { type: 'table'; headers: string[]; rows: string[][] }

export type Citation = {
  marker: number
  sourceId: string
  offsets?: { start: number; end: number }
}

export type EnhancedSource = {
  id: string
  title?: string
  page: number
  url?: string
  snippet?: string
  score: number
}

export type ResponseMetrics = {
  confidence: number
  processingTime: number
  tokenUsage?: { prompt?: number; completion?: number; total?: number }
}

export type SafetyInfo = {
  flags?: string[]
  disclaimer?: string
}
