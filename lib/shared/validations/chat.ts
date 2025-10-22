import { z } from 'zod'

// Chat message validation schema
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message must be less than 5000 characters'),
  conversationId: z.string().uuid('Invalid conversation ID format').optional().nullable()
})

// Conversation creation schema
export const createConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters')
})

// Conversation update schema
export const updateConversationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters')
})

// Message creation schema
export const createMessageSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters'),
  role: z.enum(['user', 'assistant'], { required_error: 'Role must be either user or assistant' }),
  sources: z.array(z.object({
    content: z.string(),
    page: z.number().int().min(1),
    section: z.string().optional(),
    score: z.number().min(0).max(1)
  })).optional(),
  confidence: z.number().min(0).max(1).optional(),
  lawyer_recommendations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    specialties: z.array(z.string()),
    rating: z.number().min(0).max(5),
    location: z.string()
  })).optional()
})

export type ChatMessageInput = z.infer<typeof chatMessageSchema>
export type CreateConversationInput = z.infer<typeof createConversationSchema>
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>
export type CreateMessageInput = z.infer<typeof createMessageSchema>
