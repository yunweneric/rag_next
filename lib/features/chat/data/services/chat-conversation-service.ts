import { createClient } from '@/lib/shared/utils/supabase/server'
import type { Database } from '@/lib/shared/types/database'

type ChatConversation = Database['public']['Tables']['chat_conversations']['Row']
type ChatConversationInsert = Database['public']['Tables']['chat_conversations']['Insert']
type ChatConversationUpdate = Database['public']['Tables']['chat_conversations']['Update']

type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']

export class ChatConversationService {
  private async getSupabase() {
    return await createClient()
  }

  constructor() {}

  async createConversation(userId: string, title: string): Promise<ChatConversation | null> {
    try {
      const supabase = await this.getSupabase()
      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          title: title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        return null
      }

      return conversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      return null
    }
  }

  async getConversationsByUserId(userId: string): Promise<ChatConversation[]> {
    try {
      const supabase = await this.getSupabase()
      const { data: conversations, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching conversations by user ID:', error)
        return []
      }

      return conversations || []
    } catch (error) {
      console.error('Error fetching conversations by user ID:', error)
      return []
    }
  }

  async updateConversationTitle(conversationId: string, title: string): Promise<ChatConversation | null> {
    try {
      const supabase = await this.getSupabase()
      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .update({
          title: title,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single()

      if (error) {
        console.error('Error updating conversation title:', error)
        return null
      }

      return conversation
    } catch (error) {
      console.error('Error updating conversation title:', error)
      return null
    }
  }

  async addMessage(messageData: ChatMessageInsert): Promise<ChatMessage | null> {
    try {
      const supabase = await this.getSupabase()
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single()

      if (error) {
        console.error('Error adding message:', error)
        return null
      }

      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', messageData.conversation_id)

      return message
    } catch (error) {
      console.error('Error in addMessage:', error)
      return null
    }
  }

  async getMessagesByConversationId(conversationId: string): Promise<ChatMessage[]> {
    try {
      const supabase = await this.getSupabase()
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return []
      }

      return messages || []
    } catch (error) {
      console.error('Error in getMessagesByConversationId:', error)
      return []
    }
  }

  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      const supabase = await this.getSupabase()
      
      // First delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId)

      if (messagesError) {
        console.error('Error deleting messages:', messagesError)
        return false
      }

      // Then delete the conversation
      const { error: conversationError } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)

      if (conversationError) {
        console.error('Error deleting conversation:', conversationError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteConversation:', error)
      return false
    }
  }

  async getConversationWithMessages(conversationId: string): Promise<{
    conversation: ChatConversation | null
    messages: ChatMessage[]
  }> {
    try {
      const supabase = await this.getSupabase()
      const [conversationResult, messages] = await Promise.all([
        supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', conversationId)
          .single(),
        this.getMessagesByConversationId(conversationId)
      ])

      return {
        conversation: conversationResult.data,
        messages
      }
    } catch (error) {
      console.error('Error in getConversationWithMessages:', error)
      return {
        conversation: null,
        messages: []
      }
    }
  }
}
