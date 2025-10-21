'use client'

import React, { useState } from 'react'
import { ChatInterface } from './chat-interface'
import { ConversationSidebar } from './conversation-sidebar'
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

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
      {/* Desktop sidebar */}
      <div className="hidden md:block flex-shrink-0">
        <ConversationSidebar
          userId={userId}
          currentConversationId={currentConversationId || undefined}
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden p-2 border-b flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <ConversationSidebar
                userId={userId}
                currentConversationId={currentConversationId || undefined}
                onConversationSelect={handleConversationSelect}
                onNewConversation={handleNewConversation}
              />
            </SheetContent>
          </Sheet>
          <div className="text-sm font-medium">Swiss Legal Assistant</div>
        </div>

        <ChatInterface
          userId={userId}
          conversationId={currentConversationId}
          onConversationChange={handleConversationChange}
        />
      </div>
    </div>
  )
}
