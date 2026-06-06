'use client'

import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30 mb-4">
          <Shield className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
        >
          Go to Home
        </Button>
      </div>
    </div>
  )
}
