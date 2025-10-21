import { redirect } from 'next/navigation'
import { createClient } from '@/lib/shared/utils/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  redirect('/chat')
}