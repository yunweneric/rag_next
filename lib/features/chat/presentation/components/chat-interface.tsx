'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/shared/utils/cn'
import { LawyerRecommendations } from './lawyer-recommendations'
import { Send, Trash } from 'lucide-react'
import { useAuth } from '@/lib/features/auth/hooks/use-auth'

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
  const [conversationTitle, setConversationTitle] = useState<string>('Chat')
  const [conversationUpdatedAt, setConversationUpdatedAt] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { token } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const typeMessage = (message: Message, onComplete?: () => void) => {
    const fullText = message.content
    let currentText = ''
    let index = 0
    
    setTypingMessage({ ...message, content: '' })
    
    // Faster typing with adaptive chunk size for longer messages
    const totalLength = fullText.length
    const charsPerTick = totalLength > 800 ? 6 : totalLength > 400 ? 4 : totalLength > 200 ? 2 : 1
    const intervalMs = 12

    const typeInterval = setInterval(() => {
      if (index < fullText.length) {
        const nextIndex = Math.min(index + charsPerTick, fullText.length)
        currentText += fullText.slice(index, nextIndex)
        setTypingMessage({ ...message, content: currentText })
        index = nextIndex
      } else {
        clearInterval(typeInterval)
        setTypingMessage(null)
        setMessages(prev => [...prev, { ...message, content: fullText }])
        onComplete?.()
      }
    }, intervalMs)
  }

  const formatHeaderDate = (date: Date) => {
    const now = new Date()
    const isSameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()

    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const timePart = `${hours}:${minutes}H`

    if (isSameDay) return `Today at ${timePart}`
    if (isYesterday) return `Yesterday at ${timePart}`
    return `${date.toLocaleDateString()} at ${timePart}`
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

  // Load conversation metadata (title, updated time) when conversationId changes
  useEffect(() => {
    const loadConversationMeta = async () => {
      if (!conversationId || !token) {
        setConversationTitle('Chat')
        setConversationUpdatedAt(null)
        return
      }
      try {
        const response = await fetch('/api/conversations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.ok) {
          const data = await response.json()
          const conv = (data.conversations || []).find((c: any) => c.id === conversationId)
          if (conv) {
            setConversationTitle(conv.title || 'Chat')
            setConversationUpdatedAt(conv.updated_at || conv.created_at || null)
          }
        }
      } catch (error) {
        console.error('Error loading conversation metadata:', error)
      }
    }
    loadConversationMeta()
  }, [conversationId, token])

  const loadMessages = async (convId: string) => {
    try {
      setLoadingMessages(true)
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
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
    if (!input.trim() || loading || !token) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
      <div className="border-b bg-white">
        <div className="max-w-5xl mx-auto p-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{conversationTitle}</h2>
            <p className="text-sm text-gray-500">Quick answers about Swiss law and procedures.</p>
            <p className="text-xs text-gray-400 mt-1">{formatHeaderDate(conversationUpdatedAt ? new Date(conversationUpdatedAt) : new Date())}</p>
          </div>
          <button
            type="button"
            aria-label="Delete conversation"
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-50"
            disabled={!conversationId}
            onClick={async () => {
              if (!conversationId || !token) return
              try {
                const resp = await fetch(`/api/conversations/${conversationId}`, { 
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                })
                if (resp.ok) {
                  setMessages([])
                  setConversationId(undefined)
                  setConversationTitle('Chat')
                  setConversationUpdatedAt(null)
                  onConversationChange?.(null)
                }
              } catch (error) {
                console.error('Error deleting conversation:', error)
              }
            }}
          >
            <Trash className="w-5 h-5" />
          </button>
        </div>
      </div>
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
              <p className="text-gray-700 mb-2">Ask me about Swiss law and legal procedures.</p>
              <p className="text-sm text-gray-500">I can also suggest relevant Swiss lawyers.</p>
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
              aria-label="Send message"
            >
              {loading ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
