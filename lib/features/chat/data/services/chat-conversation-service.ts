import { BaseAdminService } from '@/lib/shared/data/services/base_admin_service'
import type { Citation, ResponseMetrics } from '@/lib/shared/types/llm-response'
import { Timestamp } from 'firebase-admin/firestore'

interface Conversation {
  id?: string;
  userId: string;
  title?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface Message {
  id?: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any;
  citations?: any;
  confidence?: number;
  followUps?: any;
  metrics?: any;
  responseVersion?: number;
  createdAt?: Timestamp;
}

export class ChatConversationService {
  private conversationService: BaseAdminService<Conversation>;
  private messageService: BaseAdminService<Message>;

  constructor() {
    this.conversationService = new BaseAdminService<Conversation>('conversations');
    this.messageService = new BaseAdminService<Message>('messages');
  }

  async createConversation(userId: string, title: string) {
    const result = await this.conversationService.create({ userId, title });
    return result.success ? result.data : null;
  }

  async getConversationsByUserId(userId: string) {
    const result = await this.conversationService.search('userId', userId);
    return result.success ? result.data || [] : [];
  }

  async updateConversationTitle(conversationId: string, title: string) {
    const result = await this.conversationService.update(conversationId, { title });
    return result.success ? result.data : null;
  }

  async addMessage(messageData: {
    conversation_id: string
    role: string
    content: string
    sources?: any
    confidence?: number
    citations?: Citation[]
    follow_ups?: string[]
    metrics?: ResponseMetrics
    response_version?: number
  }) {
    const messagePayload: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> = {
      conversationId: messageData.conversation_id,
      role: messageData.role as 'user' | 'assistant',
      content: messageData.content,
      sources: messageData.sources || undefined,
      confidence: messageData.confidence || undefined,
      citations: messageData.citations || undefined,
      followUps: messageData.follow_ups || undefined,
      metrics: messageData.metrics || undefined,
      responseVersion: messageData.response_version || 1
    };

    const result = await this.messageService.create(messagePayload);
    
    // Update conversation timestamp
    if (result.success) {
      await this.conversationService.update(messageData.conversation_id, {});
    }
    
    return result.success ? result.data : null;
  }

  async addMessageV2(conversationId: string, role: string, response: import('@/lib/shared/types/llm-response').AssistantResponseV2) {
    const messagePayload: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> = {
      conversationId,
      role: role as 'user' | 'assistant',
      content: response.message.textMd,
      sources: response.sources,
      confidence: response.metrics.confidence,
      citations: response.citations,
      followUps: response.followUps,
      metrics: response.metrics,
      responseVersion: 2
    };

    const result = await this.messageService.create(messagePayload);
    
    // Update conversation timestamp
    if (result.success) {
      await this.conversationService.update(conversationId, {});
    }
    
    return result.success ? result.data : null;
  }

  async getMessagesByConversationId(conversationId: string) {
    const result = await this.messageService.search('conversationId', conversationId);
    return result.success ? result.data || [] : [];
  }

  async deleteConversation(conversationId: string) {
    // Delete messages first (Firestore doesn't have CASCADE)
    const messages = await this.getMessagesByConversationId(conversationId);
    if (messages.length > 0) {
      await Promise.all(messages.map(m => this.messageService.delete(m.id!)));
    }
    
    const result = await this.conversationService.delete(conversationId);
    return result.success;
  }

  async getConversationWithMessages(conversationId: string) {
    const [conversationResult, messages] = await Promise.all([
      this.conversationService.getById(conversationId),
      this.getMessagesByConversationId(conversationId)
    ]);

    return {
      conversation: conversationResult.success ? conversationResult.data : null,
      messages
    };
  }
}
