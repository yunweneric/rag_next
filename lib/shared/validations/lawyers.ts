import { z } from 'zod'

// Lawyer search validation schema
export const lawyerSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query must be less than 100 characters').optional()
})

// Lawyer recommendation schema
export const lawyerRecommendationSchema = z.object({
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })),
  userQuestion: z.string().min(1, 'User question is required')
})

export type LawyerSearchInput = z.infer<typeof lawyerSearchSchema>
export type LawyerRecommendationInput = z.infer<typeof lawyerRecommendationSchema>
