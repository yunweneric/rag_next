'use client'

import { useAuth } from '@/lib/shared/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'

export function UserProfile() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="animate-pulse bg-gray-200 rounded-full h-10 w-10"></div>
          <div className="space-y-2">
            <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-3 w-24 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="p-4">
        <p className="text-muted-foreground">Please log in to view your profile</p>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-10 w-10">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} />
          ) : (
            <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full">
              {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
          )}
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium">{user.displayName || 'User'}</h3>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          {user.emailVerified && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              Verified
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </Card>
  )
}
