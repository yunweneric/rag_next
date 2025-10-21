'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home } from 'lucide-react'

export default function ErrorPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <AlertTriangle className="size-5" />
          </div>
          <span className="text-xl font-semibold">Swiss Legal</span>
        </div>

        {/* Error Card */}
        <Card className="w-full">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex justify-center mb-4">
              <div className="bg-red-50 text-red-600 flex size-12 items-center justify-center rounded-full">
                <AlertTriangle className="size-6" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center font-semibold">
              Something went wrong
            </CardTitle>
            <p className="text-sm text-secondary-foreground text-center">
              We encountered an error while processing your request
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">
                Sorry, something went wrong. Please try again or contact support if the problem persists.
              </p>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <Link href="/login">
                  <Home className="mr-2 size-4" />
                  Go to Login
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}