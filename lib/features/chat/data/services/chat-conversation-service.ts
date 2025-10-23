import { BaseAdminService } from '@/lib/shared/data/services/base_admin_service'
import type { Citation, ResponseMetrics, EnhancedSource } from '@/lib/shared/types/llm-response'
import type { Conversation, Message, AssistantResponseV2 } from '../types/chat-types'

export class ChatConversationService {
  private conversationService: BaseAdminService<Conversation>;
  private messageService: BaseAdminService<Message>;

  constructor() {
    this.conversationService = new BaseAdminService<Conversation>('conversations');
    this.messageService = new BaseAdminService<Message>('messages');
  }

  async createConversation(userId: string, title: string): Promise<Conversation | null> {
    const result = await this.conversationService.create({ userId, title });
    return result.success ? (result.data || null) : null;
  }

  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    const result = await this.conversationService.search('userId', userId);
    return result.success ? result.data || [] : [];
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<Conversation | null> {
    const result = await this.conversationService.update(conversationId, { title });
    return result.success ? (result.data || null) : null;
  }

  async addMessage(messageData: {
    conversation_id: string
    role: string
    content: string
    sources?: EnhancedSource[]
    confidence?: number
    citations?: Citation[]
    follow_ups?: string[]
    metrics?: ResponseMetrics
    response_version?: number
  }): Promise<Message | null> {
    const messagePayload: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> = {
      conversationId: messageData.conversation_id,
      role: messageData.role as 'user' | 'assistant',
      content: messageData.content,
      sources: messageData.sources || null,
      confidence: messageData.confidence || null,
      citations: messageData.citations || null,
      followUps: messageData.follow_ups || null,
      metrics: messageData.metrics || null,
      responseVersion: messageData.response_version || 1
    };

    const result = await this.messageService.create(messagePayload);
    
    // Update conversation timestamp
    if (result.success) {
      await this.conversationService.update(messageData.conversation_id, {});
    }
    
    return result.success ? (result.data || null) : null;
  }

  async addMessageV2(conversationId: string, role: string, response: AssistantResponseV2): Promise<Message | null> {
    const messagePayload: Omit<Message, 'id' | 'createdAt' | 'updatedAt'> = {
      conversationId,
      role: role as 'user' | 'assistant',
      content: response.message.textMd,
      sources: response.sources || null,
      confidence: response.metrics.confidence || null,
      citations: response.citations || null,
      followUps: response.followUps || null,
      metrics: response.metrics || null,
      responseVersion: 2
    };

    const result = await this.messageService.create(messagePayload);
    
    // Update conversation timestamp
    if (result.success) {
      await this.conversationService.update(conversationId, {});
    }
    
    return result.success ? (result.data || null) : null;
  }

  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    const result = await this.messageService.search('conversationId', conversationId);
    return result.success ? result.data || [] : [];
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    // Delete messages first (Firestore doesn't have CASCADE)
    const messages = await this.getMessagesByConversationId(conversationId);
    if (messages.length > 0) {
      await Promise.all(messages.map(m => this.messageService.delete(m.id!)));
    }
    
    const result = await this.conversationService.delete(conversationId);
    return result.success;
  }

  async getConversationWithMessages(conversationId: string): Promise<{
    conversation: Conversation | null
    messages: Message[]
  }> {
    const [conversationResult, messages] = await Promise.all([
      this.conversationService.getById(conversationId),
      this.getMessagesByConversationId(conversationId)
    ]);

    return {
      conversation: conversationResult.success ? (conversationResult.data || null) : null,
      messages
    };
  }
}
