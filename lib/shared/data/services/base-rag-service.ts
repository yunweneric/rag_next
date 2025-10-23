import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import type {  EnhancedSource, Citation, ResponseMetrics } from '@/lib/shared/types/llm-response';

// Module-level singleton store
let vectorStore: PineconeStore | null = null;

export interface LawyerRecommendation {
  name: string;
  specialties: string[];
  rating: number;
  phone: string;
  email: string;
  address: string;
  availability: string;
  experience: string;
  languages: string[];
}

export interface RAGResponse {
  answer: string;
  sources: EnhancedSource[];
  confidence: number;
  processingTime: number;
  citations: Citation[];
  followUps: string[];
  metrics: ResponseMetrics;
  lawyerRecommendations?: LawyerRecommendation[];
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

  async query(question: string, conversationMessages?: any[]): Promise<RAGResponse> {
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


      // Check if the question is domain-related, considering conversation context
      const isDomainRelated = await this.isDomainRelatedQuestion(question, llm, conversationMessages);

      console.log('isDomainRelated', isDomainRelated);
      
      if (!isDomainRelated) {
        // Handle general conversation naturally
        const generalAnswer = await llm.invoke(
          `You are SwizzMitch, a Swiss legal assistant. Respond naturally to: ${question}. If it's a greeting, introduce yourself briefly and ask how you can help with legal questions. Format your response in markdown.`
        );

        const processingTime = Date.now() - startTime;
        return this.createRAGResponse(
          resolveContentToString(generalAnswer.content),
          [],
          0.5,
          processingTime,
          [],
          []
        );
      }

      // For domain-related questions, use RAG
      const retriever = vectorStore.asRetriever({ k: 5 });
      const docs = await retriever.invoke(question);

      // Build context even if no docs (might have conversation context)
      const context = this.buildContext(docs, conversationMessages);

      if (docs.length === 0 && (!conversationMessages || conversationMessages.length === 0)) {
        const processingTime = Date.now() - startTime;
        return this.createRAGResponse(
          this.getNoInformationMessage(),
          [],
          0,
          processingTime,
          [],
          []
        );
      }

      // Context already built above (handles both docs and conversation)
      // Get domain-specific prompt (no longer needs conversationContext)
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
      
      // Generate lawyer recommendations
      const lawyerRecommendations = await this.generateLawyerRecommendations(question, finalAnswer, llm);
      
      const confidence = Math.min(0.95, 0.6 + docs.length * 0.1);
      const processingTime = Date.now() - startTime;

      return this.createRAGResponse(
        textWithCitations,
        sources,
        confidence,
        processingTime,
        citations,
        followUps,
        lawyerRecommendations
      );
    } catch (error) {
      console.error("Error querying:", error);
      const processingTime = Date.now() - startTime;
      return this.createRAGResponse(
        "I'm sorry, I encountered an error processing your question. Please try again.",
        [],
        0,
        processingTime,
        [],
        []
      );
    }
  }

  protected async isDomainRelatedQuestion(
    question: string,
    llm: { invoke: (input: any) => Promise<any> },
    conversationMessages?: any[]
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
      let classificationPrompt = `Determine if this question is specifically asking about ${this.domainName} legal matters. Consider:
- Simple greetings (hi, hello) = NO
- General questions not about law = NO  
- Questions about Swiss law, legal procedures, rights, obligations = YES
- Questions about finding lawyers = YES

Answer only "YES" or "NO".

Question: "${question}"`;

      // Add conversation context if available
      if (conversationMessages && conversationMessages.length > 0) {
        const conversationContext = conversationMessages
          .slice(-3) // Use last 3 messages for context
          .map(msg => `${msg.role}: ${msg.content}`)
          .join('\n');
        
        classificationPrompt += `\n\nConversation context:\n${conversationContext}\n\nConsider the conversation history when determining if this is a legal question.`;
      }

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
  protected abstract buildContext(docs: any[], conversationMessages?: any[]): string;
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

  // Helper method to generate lawyer recommendations
  private async generateLawyerRecommendations(question: string, answer: string, llm: any): Promise<LawyerRecommendation[]> {
    try {
      const lawyerPrompt = `Based on this legal question and answer, determine if lawyer recommendations would be helpful. Only recommend lawyers if:
1. The user specifically asks for lawyer recommendations
2. The question involves complex legal procedures requiring professional assistance
3. The answer suggests the user needs professional legal representation

Question: ${question}
Answer: ${answer}

If lawyer recommendations are appropriate, provide 2-3 Swiss lawyers with the following JSON format:
{
  "lawyerRecommendations": [
    {
      "name": "Dr. [First Name] [Last Name]",
      "specialties": ["relevant practice areas"],
      "rating": 4.5,
      "phone": "+41 [area code] [number]",
      "email": "[name]@law.ch",
      "address": "[Street], [ZIP] [City], Switzerland",
      "availability": "Mon-Fri 9:00-17:00",
      "experience": "10+ years",
      "languages": ["German", "English", "French"]
    }
  ]
}

If no lawyer recommendations are needed, return: {"lawyerRecommendations": []}

Focus on lawyers who specialize in the relevant area of Swiss law mentioned in the question.`;

      const response = await llm.invoke(lawyerPrompt);
      const responseText = resolveContentToString(response.content);
      
      try {
        // Extract JSON from markdown code blocks if present
        let jsonText = responseText.trim();
        
        // Remove markdown code block markers
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Clean up any extra whitespace
        jsonText = jsonText.trim();
        
        const parsed = JSON.parse(jsonText);
        return parsed.lawyerRecommendations || [];
      } catch (parseError) {
        console.error('Error parsing lawyer recommendations JSON:', parseError);
        console.error('Response text:', responseText);
        return [];
      }
    } catch (error) {
      console.error('Error generating lawyer recommendations:', error);
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

  // Helper method to create a consistent RAG response structure
  protected createRAGResponse(
    answer: string,
    sources: EnhancedSource[] = [],
    confidence: number = 0.5,
    processingTime: number,
    citations: Citation[] = [],
    followUps: string[] = [],
    lawyerRecommendations?: LawyerRecommendation[]
  ): RAGResponse {
    return {
      answer,
      sources,
      confidence,
      processingTime,
      citations,
      followUps,
      lawyerRecommendations,
      metrics: {
        confidence,
        processingTime,
        tokenUsage: {
          prompt: 0,
          completion: 0,
          total: 0
        }
      }
    };
  }
}
