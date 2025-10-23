import { ChatPageClient } from '../components/chat-page-client'
import { ProtectedPageGuard } from '@/lib/shared/components/auth-guard'

export default async function ChatPage() {
  // Firebase Auth is handled client-side
  // Pass placeholder values - the client component will handle auth
  return (
    <ProtectedPageGuard>
      <ChatPageClient userId="" userEmail="" />
    </ProtectedPageGuard>
  )
}
