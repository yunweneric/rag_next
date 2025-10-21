import { redirect } from 'next/navigation'

export default async function Home() {
  // Redirect to chat page - auth will be handled by middleware
  redirect('/chat')
}