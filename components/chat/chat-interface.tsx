'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, User, Bot, Scale } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{
    content: string
    page: number
    section?: string
    score: number
  }>
  confidence?: number
  timestamp: Date
}

interface LawyerRecommendation {
  id: string
  name: string
  email: string
  phone?: string
  website?: string
  specialties: string[]
  location?: string
  languages?: string[]
  rating?: number
  experience_years?: number
  relevanceScore: number
  matchReasons: string[]
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Swiss Legal Assistant. I can help you with questions about Swiss law, including family law, criminal law, corporate law, employment law, real estate law, and more. How can I assist you today?',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lawyerRecommendations, setLawyerRecommendations] = useState<LawyerRecommendation[]>([])
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setShowRecommendations(false)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          conversationId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setConversationId(data.conversationId)

      if (data.shouldRecommendLawyers && data.lawyerRecommendations) {
        setLawyerRecommendations(data.lawyerRecommendations)
        setShowRecommendations(true)
      }

    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {message.role === 'user' ? <User className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              
              <Card className={`${message.role === 'user' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 font-medium">Sources:</p>
                        <div className="space-y-1">
                          {message.sources.slice(0, 3).map((source, index) => (
                            <div key={index} className="text-xs text-gray-600 bg-white p-2 rounded border">
                              <div className="flex justify-between items-start">
                                <span className="text-xs text-gray-500">Page {source.page}</span>
                                <Badge variant="outline" className="text-xs">
                                  {(source.score * 100).toFixed(0)}% match
                                </Badge>
                              </div>
                              <p className="mt-1 line-clamp-2">{source.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {message.confidence && (
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={message.confidence > 0.7 ? 'default' : message.confidence > 0.4 ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          Confidence: {(message.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">{formatTime(message.timestamp)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <Scale className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <p className="text-sm text-gray-600">Thinking...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Lawyer Recommendations */}
      {showRecommendations && lawyerRecommendations.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-blue-50">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Scale className="h-5 w-5" />
                <span>Recommended Swiss Lawyers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {lawyerRecommendations.slice(0, 3).map((lawyer) => (
                  <Card key={lawyer.id} className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">{lawyer.name}</h3>
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1">
                          {lawyer.specialties.slice(0, 3).map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        {lawyer.location && (
                          <p className="text-xs text-gray-600">📍 {lawyer.location}</p>
                        )}
                        {lawyer.rating && (
                          <p className="text-xs text-gray-600">⭐ {lawyer.rating}/5</p>
                        )}
                        {lawyer.experience_years && (
                          <p className="text-xs text-gray-600">💼 {lawyer.experience_years} years experience</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <a 
                          href={`mailto:${lawyer.email}`}
                          className="text-xs text-blue-600 hover:text-blue-800 block"
                        >
                          📧 {lawyer.email}
                        </a>
                        {lawyer.phone && (
                          <a 
                            href={`tel:${lawyer.phone}`}
                            className="text-xs text-blue-600 hover:text-blue-800 block"
                          >
                            📞 {lawyer.phone}
                          </a>
                        )}
                        {lawyer.website && (
                          <a 
                            href={lawyer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 block"
                          >
                            🌐 Website
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about Swiss law..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Ask questions about Swiss law, and I'll provide information based on legal documents and recommend qualified lawyers when appropriate.
        </p>
      </div>
    </div>
  )
}
