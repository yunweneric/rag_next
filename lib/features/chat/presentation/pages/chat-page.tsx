import { ChatPageClient } from '../components/chat-page-client'

export default async function ChatPage() {
  // Firebase Auth is handled client-side
  // Pass placeholder values - the client component will handle auth
  return <ChatPageClient userId="" userEmail="" />
}
