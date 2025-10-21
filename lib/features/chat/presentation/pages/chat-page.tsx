import { ChatPageClient } from '../components/chat-page-client'
import { createClient } from '@/lib/shared/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <ChatPageClient userId={user.id} userEmail={user.email || ''} />
}
