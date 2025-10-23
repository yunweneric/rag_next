'use client'
import { cn } from "@/lib/shared/utils/cn"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { auth } from '@/lib/shared/core/config'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/lib/shared/hooks/use-auth'
import { useAuthNavigation } from '@/lib/shared/hooks/use-navigation'
import { setAuthCookie } from '@/lib/shared/utils/cookie-utils'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { refreshUser } = useAuth()
  const { navigateToChat } = useAuthNavigation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      // Check if Firebase is properly configured
      if (!auth) {
        const errorMsg = 'Firebase is not properly configured. Please check your environment variables.'
        setError(errorMsg)
        toast.error(errorMsg)
        return
      }
      
      // Additional validation for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Firebase auth object:', auth)
        console.log('Email:', email)
        console.log('Password length:', password.length)
      }
      
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      
      if (user) {
        // Store the ID token and set cookie properly
        const token = await user.getIdToken()
        setAuthCookie(token)
        
        // Refresh the auth context to update the user state
        await refreshUser()
        
        toast.success('Successfully signed in!')
        
        // Use the custom navigation hook
        await navigateToChat()
      }
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = err.message || 'An unexpected error occurred'
      setError(errorMessage)
      
      // Show specific error messages
      if (err.code === 'auth/user-not-found') {
        toast.error('No account found with this email address')
      } else if (err.code === 'auth/wrong-password') {
        toast.error('Incorrect password')
      } else if (err.code === 'auth/invalid-email') {
        toast.error('Invalid email address')
      } else if (err.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
        </div>
        
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            disabled={loading}
          />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            disabled={loading}
          />
        </Field>
        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </Field>
        <FieldSeparator></FieldSeparator>
        <Field>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="underline underline-offset-4">
              Sign up
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}