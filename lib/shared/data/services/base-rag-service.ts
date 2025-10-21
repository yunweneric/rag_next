import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Ollama } from "ollama";

// Module-level singleton store
let vectorStore: PineconeStore | null = null;

export interface RAGResponse {
  answer: string;
  sources: Array<{
    content: string;
    page: number;
    section?: string;
    score: number;
  }>;
  confidence: number;
  processingTime: number;
}

// Custom Ollama embeddings class for LangChain compatibility
class OllamaEmbeddings {
  private ollama: Ollama;
  private model: string;

  constructor(config: { model: string; baseUrl: string }) {
    this.ollama = new Ollama({ host: config.baseUrl });
    this.model = config.model;
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await this.ollama.embeddings({
      model: this.model,
      prompt: text,
    });
    return response.embedding;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await this.embedQuery(text);
      embeddings.push(embedding);
    }
    return embeddings;
  }
}

// Custom Ollama chat class for LangChain compatibility
class ChatOllama {
  private ollama: Ollama;
  private model: string;

  constructor(config: { model: string; baseUrl: string }) {
    this.ollama = new Ollama({ host: config.baseUrl });
    this.model = config.model;
  }

  async invoke(input: any): Promise<any> {
    // Handle different input formats
    let messages: any[];

    if (Array.isArray(input)) {
      messages = input;
    } else if (input && typeof input === "object" && input.messages) {
      messages = input.messages;
    } else if (typeof input === "string") {
      messages = [{ role: "user", content: input }];
    } else {
      messages = [{ role: "user", content: String(input) }];
    }

    const response = await this.ollama.chat({
      model: this.model,
      messages: messages,
    });
    return { content: response.message.content };
  }

  // Add required properties for LangChain compatibility
  get callKeys(): string[] {
    return ["stop"];
  }

  get _modelType(): string {
    return "ollama";
  }

  get _llmType(): string {
    return "ollama";
  }
}

export interface BaseRAGConfig {
  ollamaUrl: string;
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
  protected ollamaUrl: string;
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
    this.ollamaUrl = config.ollamaUrl;
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

      // Create embeddings
      const embeddings = new OllamaEmbeddings({
        model: this.embedModel,
        baseUrl: this.ollamaUrl,
      });

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
        const embeddings = new OllamaEmbeddings({
          model: this.embedModel,
          baseUrl: this.ollamaUrl,
        });
        const pc = new Pinecone({ apiKey: this.pineconeApiKey });
        const pineconeIndex = pc.index(this.indexName);
        vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
          pineconeIndex: pineconeIndex as any,
        });
      }

      // Set up LLM
      const llm = new ChatOllama({
        model: this.llmModel,
        baseUrl: this.ollamaUrl,
      });

      // Check if the question is domain-related
      const isDomainRelated = await this.isDomainRelatedQuestion(question, llm);

      console.log('isDomainRelated', isDomainRelated);
      
      if (!isDomainRelated) {
        // Handle general conversation naturally
        const generalAnswer = await llm.invoke([
          {
            role: "user",
            content: `You are a helpful Swiss legal assistant. Respond naturally to this: ${question}. If it's a greeting, introduce yourself as a Swiss legal assistant and explain how you can help with legal questions.

IMPORTANT: Always format your response in markdown. Use proper markdown syntax for:
- Headers (# ## ###)
- Bold text (**bold**)
- Italic text (*italic*)
- Lists (- item or 1. item)
- Code blocks (\`\`\`language)
- Links ([text](url))
- Blockquotes (> quote)

Format your response in markdown:`,
          },
        ]);

        return {
          answer: generalAnswer.content,
          sources: [],
          confidence: 0.5,
          processingTime: Date.now() - startTime,
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

      const answer = await llm.invoke([{ role: "user", content: markdownPrompt }]);
      const finalAnswer = answer.content;

      // Format sources with better relevance
      const sources = docs.map((d: any, i: number) => ({
        content: d.pageContent,
        page: d.metadata?.loc?.pageNumber || 0,
        section: d.metadata?.section,
        score: Math.max(0.1, 0.9 - i * 0.2),
      }));

      const confidence = Math.min(0.95, 0.6 + docs.length * 0.1);

      return {
        answer: finalAnswer,
        sources,
        confidence,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Error querying:", error);
      return {
        answer: "I'm sorry, I encountered an error processing your question. Please try again.",
        sources: [],
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }
  }

  protected async isDomainRelatedQuestion(
    question: string,
    llm: ChatOllama
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

      const response = await llm.invoke([
        { role: "user", content: classificationPrompt },
      ]);
      const isRelated = response.content.trim().toUpperCase().includes("YES");
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
}
