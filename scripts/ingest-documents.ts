import { SwissLegalService } from '../lib/features/chat/data/services/swiss-legal-service'
import { readFileSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function ingestDocuments() {
  console.log('Starting document ingestion...')
  
  // Debug environment variables
  console.log('Environment variables:')
  console.log('PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? 'Set' : 'Not set')
  console.log('OLLAMA_URL:', process.env.OLLAMA_URL || 'http://localhost:11434')

  // Initialize the Swiss Legal Service
  const legalService = new SwissLegalService({
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    llmModel: 'llama3.2',
    embedModel: 'nomic-embed-text',
    pineconeApiKey: process.env.PINECONE_API_KEY || '',
    indexName: 'swiss-legal',
    domainKeywords: [],
    domainName: 'Swiss Legal System',
    documentPath: './public/docs/swiss_legal.pdf',
    chunkSize: 1200,
    chunkOverlap: 300
  })

  try {
    // Check if the PDF file exists
    const pdfPath = join(process.cwd(), 'public/docs/swiss_legal.pdf')
    
    console.log('Looking for PDF at:', pdfPath)
    
    // Process the actual PDF document
    const pdfResult = await legalService.processDocument()
    
    if (pdfResult.success) {
      console.log('✅ Document processing completed successfully!')
      console.log(`📊 Stats: ${pdfResult.stats.totalChunks} chunks, ${pdfResult.stats.totalPages} pages`)
      console.log(`⏱️ Processing time: ${pdfResult.stats.processingTime}ms`)
    } else {
      console.error('❌ Document processing failed:', pdfResult.message)
    }
    
    // For testing purposes, we'll also create some test documents
    const testDocuments = [
      {
        pageContent: `
Swiss Civil Code (ZGB) - Article 1: Sources of Law

The law governs all matters for which it contains a provision either in its wording or according to its proper meaning.

If no provision can be derived from the law, the judge shall decide according to customary law and, failing that, according to the rule that he would establish as legislator.

In doing so, he shall follow established doctrine and case law.

This article establishes the hierarchy of legal sources in Swiss law, with statutory law taking precedence over customary law and judicial interpretation.
        `,
        metadata: {
          source: 'Swiss Civil Code',
          page: 1,
          section: 'General Provisions'
        }
      },
      {
        pageContent: `
Swiss Civil Code (ZGB) - Article 8: Legal Capacity

Every person has the legal capacity to have rights and obligations.

Legal capacity begins at birth and ends at death.

Minors and persons under guardianship have limited legal capacity as provided by law.

This fundamental principle ensures that all individuals have the ability to enter into legal relationships under Swiss law.
        `,
        metadata: {
          source: 'Swiss Civil Code',
          page: 8,
          section: 'Legal Capacity'
        }
      },
      {
        pageContent: `
Swiss Criminal Code (StGB) - Article 1: Principle of Legality

An act may be punished only if the punishment was prescribed by law before the act was committed.

This principle, known as nulla poena sine lege, ensures that criminal liability can only be established on the basis of existing law.

The principle protects individuals from retroactive criminal legislation and ensures legal certainty in criminal matters.
        `,
        metadata: {
          source: 'Swiss Criminal Code',
          page: 1,
          section: 'General Provisions'
        }
      },
      {
        pageContent: `
Swiss Employment Law - Termination of Employment

Employment relationships in Switzerland are governed by the Code of Obligations (OR).

Either party may terminate an employment relationship by giving notice in accordance with the statutory notice periods.

The notice period depends on the length of employment and ranges from one month to three months.

Employees have protection against unfair dismissal, and certain categories of employees enjoy enhanced protection.

The Swiss labor courts have jurisdiction over employment disputes and can order reinstatement or compensation.
        `,
        metadata: {
          source: 'Swiss Employment Law',
          page: 1,
          section: 'Termination'
        }
      },
      {
        pageContent: `
Swiss Family Law - Marriage and Divorce

Marriage in Switzerland is a civil institution regulated by the Civil Code.

The minimum age for marriage is 18 years, and both parties must freely consent to the marriage.

Divorce can be granted on various grounds, including mutual consent, separation, or fault-based grounds.

The court will determine issues of child custody, visitation rights, and financial support in divorce proceedings.

Swiss family law emphasizes the best interests of the child in all custody and support decisions.
        `,
        metadata: {
          source: 'Swiss Family Law',
          page: 1,
          section: 'Marriage and Divorce'
        }
      }
    ]

    console.log(`Processing ${testDocuments.length} test documents...`)

    // Process the documents
    const result = await legalService.processDocument(testDocuments)

    if (result.success) {
      console.log('✅ Document ingestion completed successfully!')
      console.log(`📊 Statistics:`)
      console.log(`   - Total chunks: ${result.stats.totalChunks}`)
      console.log(`   - Total pages: ${result.stats.totalPages}`)
      console.log(`   - Processing time: ${result.stats.processingTime}ms`)
    } else {
      console.error('❌ Document ingestion failed:', result.message)
    }

  } catch (error) {
    console.error('❌ Error during document ingestion:', error)
  }
}

// Run the ingestion if this script is executed directly
if (require.main === module) {
  ingestDocuments()
    .then(() => {
      console.log('Document ingestion script completed.')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Document ingestion script failed:', error)
      process.exit(1)
    })
}

export { ingestDocuments }
