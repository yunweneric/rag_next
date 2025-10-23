'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// These server actions are deprecated - Firebase Auth is handled client-side
// The login and signup forms now use Firebase Auth directly

export async function login(formData: FormData) {
  // This function is deprecated - use Firebase Auth client-side
  redirect('/login')
}

export async function signup(formData: FormData) {
  // This function is deprecated - use Firebase Auth client-side
  redirect('/signup')
}
