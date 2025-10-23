import { NextRequest, NextResponse } from 'next/server'
import { SwissLegalService } from '@/lib/features/chat/data/services/swiss-legal-service'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

function requireEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export async function POST(request: NextRequest) {
  try {
    // const adminKey = request.headers.get('x-admin-key')
    // if (!adminKey || adminKey !== process.env.ADMIN_API_KEY) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json().catch(() => ({} as any))
    const {
      mode = 'pdf',
      chunkSize = 1200,
      chunkOverlap = 300,
    }: { mode?: 'pdf' | 'test'; chunkSize?: number; chunkOverlap?: number } = body || {}

    const OPENAI_API_KEY = requireEnv('OPENAI_API_KEY')
    const PINECONE_API_KEY = requireEnv('PINECONE_API_KEY')
    const PINECONE_INDEX = process.env.PINECONE_INDEX || 'swiss-legal-openai-1536'
    const OPENAI_EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small'
    const OPENAI_LLM_MODEL = process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini'

    // Touch variables to satisfy TS when running in some environments
    void OPENAI_API_KEY

    const legalService = new SwissLegalService({
      llmModel: OPENAI_LLM_MODEL,
      embedModel: OPENAI_EMBED_MODEL,
      pineconeApiKey: PINECONE_API_KEY,
      indexName: PINECONE_INDEX,
      domainKeywords: [],
      domainName: 'Swiss Legal System',
      documentPath: './public/docs/swiss_legal.pdf',
      chunkSize,
      chunkOverlap,
    })

    let result
    if (mode === 'pdf') {
      result = await legalService.processDocument()
    } else {
      const testDocuments = [
        {
          pageContent: `Swiss Civil Code (ZGB) - Article 1: Sources of Law\n\nThe law governs all matters for which it contains a provision either in its wording or according to its proper meaning.`,
          metadata: { source: 'Swiss Civil Code', page: 1, section: 'General Provisions' },
        },
      ]
      result = await legalService.processDocument(testDocuments as any)
    }

    return NextResponse.json({
      ok: result.success,
      index: PINECONE_INDEX,
      message: result.message,
      stats: result.stats,
    })
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Ingestion failed' },
      { status: 500 }
    )
  }
}


