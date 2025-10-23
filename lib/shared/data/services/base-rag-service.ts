import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import type { AssistantResponseV2, EnhancedSource, Citation, ResponseMetrics } from '@/lib/shared/types/llm-response';

// Module-level singleton store
let vectorStore: PineconeStore | null = null;

export interface RAGResponse {
  answer: string;
  sources: EnhancedSource[];
  confidence: number;
  processingTime: number;
  citations: Citation[];
  followUps: string[];
  metrics: ResponseMetrics;
}

// Normalize LangChain/OpenAI message content to a string
function resolveContentToString(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          if (typeof part.text === "string") return part.text;
          if (typeof part.content === "string") return part.content;
          if (typeof part.type === "string") return part.type;
        }
        return "";
      })
      .join("");
  }
  if (content && typeof content === "object") {
    if (typeof content.text === "string") return content.text;
    if (typeof content.content === "string") return content.content;
  }
  try {
    return JSON.stringify(content);
  } catch {
    return String(content ?? "");
  }
}

export interface BaseRAGConfig {
  llmModel: string;
  embedModel: string;
  pineconeApiKey: string;
  indexName: string;
  domainKeywords: string[];
  domainName: string;
  documentPath?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

export abstract class BaseRAGService {
  protected llmModel: string;
  protected embedModel: string;
  protected pineconeApiKey: string;
  protected indexName: string;
  protected domainKeywords: string[];
  protected domainName: string;
  protected documentPath?: string;
  protected chunkSize: number;
  protected chunkOverlap: number;

  constructor(config: BaseRAGConfig) {
    this.llmModel = config.llmModel;
    this.embedModel = config.embedModel;
    this.pineconeApiKey = config.pineconeApiKey;
    this.indexName = config.indexName;
    this.domainKeywords = config.domainKeywords;
    this.domainName = config.domainName;
    this.documentPath = config.documentPath;
    this.chunkSize = config.chunkSize || 1200;
    this.chunkOverlap = config.chunkOverlap || 300;
  }

  async processDocument(documents?: any[]): Promise<{
    success: boolean;
    message: string;
    stats: { totalChunks: number; totalPages: number; processingTime: number };
  }> {
    const startTime = Date.now();

    try {
      let docs = documents;
      
      // Load documents from path if no documents provided
      if (!docs && this.documentPath) {
        const loader = new PDFLoader(this.documentPath);
        docs = await loader.load();
        console.log(`Loaded ${docs.length} pages from PDF`);
      } else if (docs) {
        console.log(`Loaded ${docs.length} pages`);
      } else {
        throw new Error("No documents provided and no document path configured");
      }

      // Split into chunks using configured sizes
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: this.chunkSize,
        chunkOverlap: this.chunkOverlap,
      });
      const chunks = await textSplitter.splitDocuments(docs);
      console.log(`Split into ${chunks.length} chunks`);

      // Create embeddings (OpenAI)
      const embeddings = new OpenAIEmbeddings({
        model: this.embedModel,
        apiKey: process.env.OPENAI_API_KEY,
      } as any);

      // Auto-detect embedding dimension
      const testEmbed = await embeddings.embedQuery("dimension test");
      const dimension = testEmbed.length;
      console.log(`Embedding dimension: ${dimension}`);

      // Initialize Pinecone
      const pc = new Pinecone({ apiKey: this.pineconeApiKey });

      // Ensure index exists with correct dimension
      const indexes = await pc.listIndexes();
      const exists = indexes.indexes?.some((i) => i.name === this.indexName);
      if (!exists) {
        await pc.createIndex({
          name: this.indexName,
          dimension,
          metric: "cosine",
          spec: { serverless: { cloud: "aws", region: "us-east-1" } },
        });
        console.log(`Created Pinecone index: ${this.indexName}`);
      }

      const pineconeIndex = pc.index(this.indexName);

      // Store vectors in Pinecone
      vectorStore = await PineconeStore.fromDocuments(chunks, embeddings, {
        pineconeIndex: pineconeIndex as any,
      });
      console.log(`Stored ${chunks.length} chunks in Pinecone`);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        message: "Document processed successfully",
        stats: {
          totalChunks: chunks.length,
          totalPages: docs.length,
          processingTime,
        },
      };
    } catch (error) {
      console.error("Error processing document:", error);
      return {
        success: false,
        message: `Failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        stats: {
          totalChunks: 0,
          totalPages: 0,
          processingTime: Date.now() - startTime,
        },
      };
    }
  }

  async query(question: string): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      if (!vectorStore) {
        // Initialize from existing index
        const embeddings = new OpenAIEmbeddings({
          model: this.embedModel,
          apiKey: process.env.OPENAI_API_KEY,
        } as any);
        const pc = new Pinecone({ apiKey: this.pineconeApiKey });
        const pineconeIndex = pc.index(this.indexName);
        vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
          pineconeIndex: pineconeIndex as any,
        });
      }

      // Set up LLM (OpenAI)
      const llm = new ChatOpenAI({
        model: this.llmModel,
        temperature: 0.2,
        apiKey: process.env.OPENAI_API_KEY,
      } as any);

      // Check if the question is domain-related
      const isDomainRelated = await this.isDomainRelatedQuestion(question, llm);

      console.log('isDomainRelated', isDomainRelated);
      
      if (!isDomainRelated) {
        // Handle general conversation naturally
        const generalAnswer = await llm.invoke(
          `You are a helpful Swiss legal assistant. Respond naturally to this: ${question}. If it's a greeting, introduce yourself as a Swiss legal assistant and explain how you can help with legal questions.

IMPORTANT: Always format your response in markdown. Use proper markdown syntax for:
- Headers (# ## ###)
- Bold text (**bold**)
- Italic text (*italic*)
- Lists (- item or 1. item)
- Code blocks (\`\`\`language)
- Links ([text](url))
- Blockquotes (> quote)

Format your response in markdown:`
        );

        return {
          answer: resolveContentToString(generalAnswer.content),
          sources: [],
          confidence: 0.5,
          processingTime: Date.now() - startTime,
          citations: [],
          followUps: [],
          metrics: {
            confidence: 0.5,
            processingTime: Date.now() - startTime,
            tokenUsage: { prompt: 0, completion: 0, total: 0 }
          }
        };
      }

      // For domain-related questions, use RAG
      const retriever = vectorStore.asRetriever({ k: 5 });
      const docs = await retriever.invoke(question);

      if (docs.length === 0) {
        return {
          answer: this.getNoInformationMessage(),
          sources: [],
          confidence: 0,
          processingTime: Date.now() - startTime,
          citations: [],
          followUps: [],
          metrics: {
            confidence: 0,
            processingTime: Date.now() - startTime,
            tokenUsage: { prompt: 0, completion: 0, total: 0 }
          }
        };
      }

      // Build context from retrieved docs
      const context = this.buildContext(docs);

      // Get domain-specific prompt
      const prompt = this.getDomainPrompt(context, question);

      // Add markdown formatting instruction to ensure consistent output
      const markdownPrompt = `${prompt}

CRITICAL: Format your entire response in markdown. Use proper markdown syntax including:
- Headers (# ## ###)
- Bold text (**text**)
- Italic text (*text*)
- Lists (- item or 1. item)
- Code blocks (\`\`\`language)
- Links ([text](url))
- Blockquotes (> quote)

Your response must be in markdown format.`;

      const answer = await llm.invoke(markdownPrompt);
      const finalAnswer = resolveContentToString(answer.content);

      // Create enhanced sources with stable IDs and URLs
      const sources = this.createEnhancedSources(docs);
      
      // Attach citations to the answer
      const { textWithCitations, citations } = this.attachCitations(finalAnswer, sources);
      
      // Generate follow-up questions
      const followUps = await this.generateFollowUps(question, finalAnswer, llm);
      
      const confidence = Math.min(0.95, 0.6 + docs.length * 0.1);
      const processingTime = Date.now() - startTime;

      return {
        answer: textWithCitations,
        sources,
        confidence,
        processingTime,
        citations,
        followUps,
        metrics: {
          confidence,
          processingTime,
          tokenUsage: {
            prompt: 0, // Could be enhanced to track actual token usage
            completion: 0,
            total: 0
          }
        }
      };
    } catch (error) {
      console.error("Error querying:", error);
      return {
        answer: "I'm sorry, I encountered an error processing your question. Please try again.",
        sources: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
        citations: [],
        followUps: [],
        metrics: {
          confidence: 0,
          processingTime: Date.now() - startTime,
          tokenUsage: { prompt: 0, completion: 0, total: 0 }
        }
      };
    }
  }

  protected async isDomainRelatedQuestion(
    question: string,
    llm: { invoke: (input: any) => Promise<any> }
  ): Promise<boolean> {
    const lowerQuestion = question.toLowerCase().trim();
    
    // First check for simple greetings and non-legal questions
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'hallo', 'guten tag', 'bonjour', 'ciao'];
    const isGreeting = greetings.some(greeting => lowerQuestion.includes(greeting));
    
    if (isGreeting && lowerQuestion.length < 50) {
      return false; // Don't use RAG for simple greetings
    }
    
    // Check for obvious non-legal questions
    const nonLegalPatterns = [
      'how are you', 'what time', 'weather', 'news', 'sports', 'music', 'movie', 'food', 'travel', 'shopping',
      'wie geht es', 'wie spät', 'wetter', 'nachrichten', 'sport', 'musik', 'film', 'essen', 'reisen', 'einkaufen'
    ];
    
    const isNonLegal = nonLegalPatterns.some(pattern => lowerQuestion.includes(pattern));
    if (isNonLegal) {
      return false;
    }
    
    // Check for domain keywords
    const hasDomainKeywords = this.domainKeywords.some((keyword) =>
      lowerQuestion.includes(keyword.toLowerCase())
    );

    if (hasDomainKeywords) return true;

    // Use LLM to determine if it's domain-related for ambiguous cases
    try {
      const classificationPrompt = `Determine if this question is specifically asking about ${this.domainName} legal matters. Consider:
- Simple greetings (hi, hello) = NO
- General questions not about law = NO  
- Questions about Swiss law, legal procedures, rights, obligations = YES
- Questions about finding lawyers = YES

Answer only "YES" or "NO".

Question: "${question}"`;

      const response = await llm.invoke(classificationPrompt);
      const responseText = resolveContentToString(response.content);
      const isRelated = responseText.trim().toUpperCase().includes("YES");
      console.log(`Question: "${question}" -> Domain related: ${isRelated}`);
      return isRelated;
    } catch (error) {
      console.error("Error in domain classification:", error);
      // Fallback to keyword matching
      return hasDomainKeywords;
    }
  }

  // Abstract methods to be implemented by specific domain services
  protected abstract getNoInformationMessage(): string;
  protected abstract buildContext(docs: any[]): string;
  protected abstract getDomainPrompt(context: string, question: string): string;

  async isReady(): Promise<boolean> {
    try {
      if (vectorStore) return true;

      // Check Pinecone index
      const pc = new Pinecone({ apiKey: this.pineconeApiKey });
      const stats = await pc.index(this.indexName).describeIndexStats();
      return (stats.totalRecordCount || 0) > 0;
    } catch {
      return false;
    }
  }

  // Helper method to generate follow-up questions
  private async generateFollowUps(question: string, answer: string, llm: any): Promise<string[]> {
    try {
      const followUpPrompt = `Based on this question and answer, suggest 3 helpful follow-up questions that a user might want to ask. Keep them concise and relevant.

Question: ${question}
Answer: ${answer}

Return only the questions, one per line, without numbering or bullet points.`;

      const response = await llm.invoke(followUpPrompt);
      const responseText = resolveContentToString(response.content);
      
      return responseText
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0)
        .slice(0, 3);
    } catch (error) {
      console.error('Error generating follow-ups:', error);
      return [];
    }
  }

  // Helper method to create enhanced sources with stable IDs and URLs
  private createEnhancedSources(docs: any[]): EnhancedSource[] {
    return docs.map((doc, index) => {
      const page = doc.metadata?.loc?.pageNumber || 0;
      const content = doc.pageContent || '';
      const score = Math.max(0.1, 0.9 - index * 0.2);
      
      // Create stable ID based on content hash and page
      const contentHash = this.hashString(content.slice(0, 100));
      const id = `pdf:${page}:${contentHash}`;
      
      return {
        id,
        title: `Swiss Legal Code – Page ${page}`,
        page,
        url: `/docs/swiss_legal.pdf#page=${page}`,
        snippet: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
        score
      };
    });
  }

  // Helper method to attach citations to answer text
  private attachCitations(answer: string, sources: EnhancedSource[]): { textWithCitations: string; citations: Citation[] } {
    const citations: Citation[] = [];
    let textWithCitations = answer;
    
    // Add citation markers [1], [2], etc. at the end of sentences that reference sources
    sources.forEach((source, index) => {
      const marker = index + 1;
      citations.push({
        marker,
        sourceId: source.id
      });
      
      // Add citation marker at the end of the text
      textWithCitations += ` [${marker}]`;
    });
    
    return { textWithCitations, citations };
  }

  // Helper method to create a simple hash of a string
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
