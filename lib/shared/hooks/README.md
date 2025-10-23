# Authentication Hooks

This directory contains custom React hooks for managing authentication state throughout the application.

## Available Hooks

### `useAuth()`
The main authentication hook that provides:
- `user`: Current user object or null
- `loading`: Boolean indicating if auth state is being determined
- `signOut()`: Function to sign out the current user
- `refreshUser()`: Function to refresh user data

### `useUser()`
A simpler hook that provides:
- `user`: Current user object or null
- `loading`: Boolean indicating if auth state is being determined
- `error`: Any authentication error
- `refreshUser()`: Function to refresh user data
- `isAuthenticated`: Boolean indicating if user is logged in

### `useAuthStatus()`
A hook for checking authentication status:
- `isAuthenticated`: Boolean indicating if user is logged in
- `isLoading`: Boolean indicating if auth state is being determined
- `user`: Current user object or null

## Usage Examples

### Basic Authentication Check
```tsx
import { useAuth } from '@/lib/shared/hooks/use-auth'

function MyComponent() {
  const { user, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>

  return (
    <div>
      <p>Welcome, {user.displayName || user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Using the User Hook
```tsx
import { useUser } from '@/lib/shared/hooks/use-user'

function UserProfile() {
  const { user, loading, error, isAuthenticated } = useUser()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!isAuthenticated) return <div>Please log in</div>

  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {user?.email}</p>
      <p>Name: {user?.displayName}</p>
      <p>Email Verified: {user?.emailVerified ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

### Authentication Status Check
```tsx
import { useAuthStatus } from '@/lib/shared/hooks/use-auth'

function ProtectedComponent() {
  const { isAuthenticated, isLoading } = useAuthStatus()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Access denied</div>

  return <div>Protected content</div>
}
```

## Setup

Make sure to wrap your app with the `AuthProvider` in your root layout:

```tsx
import { AuthProvider } from '@/lib/shared/hooks/use-auth'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

## Toast Notifications

The hooks are integrated with Sonner for toast notifications. Success and error messages are automatically shown for authentication actions.
