'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/shared/utils/cn'
import { LawyerRecommendations } from './lawyer-recommendations'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ content: string; page: number; section?: string; score: number }>
  confidence?: number
  lawyerRecommendations?: any[] // TODO: Define a proper type for lawyer recommendations
}

interface ChatInterfaceProps {
  userId: string
  conversationId?: string | null
  onConversationChange?: (conversationId: string | null) => void
}

export function ChatInterface({ userId, conversationId: propConversationId, onConversationChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>(propConversationId || undefined)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [typingMessage, setTypingMessage] = useState<Message | null>(null)
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const typeMessage = (message: Message, onComplete?: () => void) => {
    const fullText = message.content
    let currentText = ''
    let index = 0
    
    setTypingMessage({ ...message, content: '' })
    
    const typeInterval = setInterval(() => {
      if (index < fullText.length) {
        currentText += fullText[index]
        setTypingMessage({ ...message, content: currentText })
        index++
      } else {
        clearInterval(typeInterval)
        setTypingMessage(null)
        setMessages(prev => [...prev, { ...message, content: fullText }])
        onComplete?.()
      }
    }, 20) // Adjust speed as needed (lower = faster)
  }

  useEffect(() => {
    scrollToBottom()
    setUserHasScrolledUp(false)
  }, [messages])

  // Track user scroll behavior
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 100
      setUserHasScrolledUp(!isNearBottom)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Only auto-scroll during typing if user hasn't scrolled up
  useEffect(() => {
    if (typingMessage && !userHasScrolledUp) {
      requestAnimationFrame(() => {
        scrollToBottom()
      })
    }
  }, [typingMessage, userHasScrolledUp])

  // Load messages when conversationId changes
  useEffect(() => {
    if (propConversationId !== conversationId) {
      setConversationId(propConversationId || undefined)
      if (propConversationId) {
        loadMessages(propConversationId)
      } else {
        setMessages([])
      }
    }
  }, [propConversationId])

  const loadMessages = async (convId: string) => {
    try {
      setLoadingMessages(true)
      const response = await fetch(`/api/conversations/${convId}/messages`)
      if (response.ok) {
        const data = await response.json()
        const formattedMessages = data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          sources: msg.sources,
          confidence: msg.confidence,
          lawyerRecommendations: msg.lawyer_recommendations
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input, conversationId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const aiMessage: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        lawyerRecommendations: data.lawyerRecommendations,
      }
      
      // Start typing animation
      typeMessage(aiMessage, () => {
        setConversationId(data.conversationId)
        onConversationChange?.(data.conversationId)
      })
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again."
      }
      typeMessage(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              Loading conversation...
            </div>
          </div>
        ) : messages.length === 0 && !loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                I can help you with legal information!
              </h1>
              <p className="text-gray-500 mb-4">
                Ask me anything about Swiss legal matters. I can provide information about Swiss law, legal procedures, and help you understand your legal rights and obligations.
              </p>
              <p className="text-sm text-gray-400 mb-8">
                If I don't understand your question, I'll ask for clarification. At the end of our conversation, I can recommend qualified Swiss lawyers who specialize in your area of concern.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-3',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {msg.role === 'assistant' && (
              <Avatar>
                <AvatarImage src="/ai-avatar.png" alt="AI" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                'max-w-[70%] p-3 rounded-lg',
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              )}
            >
              <p className="text-sm">{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Sources: {msg.sources.map((source, sIndex) => `Page ${source.page}`).join(', ')}
                </div>
              )}
              {msg.lawyerRecommendations && msg.lawyerRecommendations.length > 0 && (
                <LawyerRecommendations lawyers={msg.lawyerRecommendations} />
              )}
            </div>
            {msg.role === 'user' && (
              <Avatar>
                <AvatarImage src="/user-avatar.png" alt="User" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-start gap-3">
            <Avatar>
              <AvatarImage src="/ai-avatar.png" alt="AI" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="max-w-[70%] p-3 rounded-lg bg-gray-100 rounded-bl-none">
              <p className="text-sm animate-pulse">Thinking...</p>
            </div>
          </div>
        )}
        {typingMessage && (
          <div className="flex justify-start items-start gap-3">
            <Avatar>
              <AvatarImage src="/ai-avatar.png" alt="AI" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="max-w-[70%] p-3 rounded-lg bg-gray-100 rounded-bl-none">
              <p className="text-sm whitespace-pre-wrap">{typingMessage.content}</p>
              <div className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1"></div>
            </div>
          </div>
        )}
        {typingMessage && userHasScrolledUp && (
          <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-2 rounded-full text-sm shadow-lg z-10">
            AI is typing...
          </div>
        )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="border-t bg-white p-4">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
            <Input
              placeholder="Ask anything"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 h-12 rounded-lg border-gray-300 focus:border-gray-400 focus:ring-0"
            />
            <Button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="h-12 px-6 rounded-lg"
            >
              {loading ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
