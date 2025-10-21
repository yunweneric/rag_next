'use client'

import React, { useState } from 'react'
import { ChatInterface } from './chat-interface'
import { ConversationSidebar } from './conversation-sidebar'

interface ChatPageClientProps {
  userId: string
  userEmail: string
}

export function ChatPageClient({ userId, userEmail }: ChatPageClientProps) {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)

  const handleConversationSelect = (conversationId: string | null) => {
    setCurrentConversationId(conversationId)
  }

  const handleNewConversation = () => {
    setCurrentConversationId(null)
  }

  const handleConversationChange = (conversationId: string | null) => {
    setCurrentConversationId(conversationId)
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <ConversationSidebar
          userId={userId}
          currentConversationId={currentConversationId || undefined}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatInterface
          userId={userId}
          conversationId={currentConversationId}
          onConversationChange={handleConversationChange}
        />
      </div>
    </div>
  )
}
