import { BaseRAGService, BaseRAGConfig } from "./base-rag-service";

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

export interface LangChainRAGConfig extends BaseRAGConfig {
  pdfPath: string;
}

export class LangChainRAGService extends BaseRAGService {
  private pdfPath: string;

  constructor(config: LangChainRAGConfig) {
    super({
      ...config,
      documentPath: config.pdfPath,
    });
    this.pdfPath = config.pdfPath;
  }

  // Override processDocument to use PDF path
  async processDocument(): Promise<{
    success: boolean;
    message: string;
    stats: { totalChunks: number; totalPages: number; processingTime: number };
  }> {
    return super.processDocument();
  }

  // Implement abstract methods for tax domain
  protected getNoInformationMessage(): string {
    return "I don't have specific information about that in the Cameroon tax code. Could you rephrase your question or ask about something else?";
  }

  protected buildContext(docs: any[]): string {
    return docs
      .map(
        (d, i) =>
          `Article ${d.metadata?.loc?.pageNumber || "Unknown"}:\n${
            d.pageContent
          }`
      )
      .join("\n\n");
  }

  protected getDomainPrompt(context: string, question: string): string {
    return `You are a tax expert assistant for Cameroon tax code. Based on the following tax code articles, provide a clear and concise answer to the user's question.

Tax Code Articles:
${context}

Question: ${question}

Instructions:
- Provide a direct, clear answer based ONLY on the tax code articles above
- If the answer is found in the articles, reference the specific article number
- Keep your response concise and professional
- If the information is not complete in the provided articles, say so clearly
- Format your response as: "Answer: [your answer] (Reference: Article [number])"`;
  }
}