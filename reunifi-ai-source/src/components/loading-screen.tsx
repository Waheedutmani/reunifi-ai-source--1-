'use client'

import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'

/**
 * Lightweight loading screen with safety timeout.
 * - Shows spinner for up to 5 seconds max
 * - Falls back to a static "Loading..." text if timeout
 * - No heavy animations or framer-motion dependency
 * - Uses only Tailwind CSS animations
 */
export function LoadingScreen() {
  const [timedOut, setTimedOut] = useState(false)

  // Safety: if loading takes too long, show a simpler fallback
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (timedOut) {
    // Minimal fallback — no animations, just text
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground tracking-tight">Reunifi AI</h1>
            <p className="text-xs text-muted-foreground mt-1">Taking longer than usual...</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-xs text-cyan-500 hover:text-cyan-400 underline underline-offset-2"
          >
            Click to refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Logo with simple pulse */}
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg animate-pulse">
            <Shield className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* App name */}
        <div className="text-center">
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Reunifi AI
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Loading platform...
          </p>
        </div>

        {/* Progress bar — uses Tailwind animate-spin on a small element */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-teal-500 rounded-full"
            style={{
              animation: 'loadingBar 2.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Inline keyframes — minimal, only for the loading bar */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loadingBar {
          0% { width: 0%; }
          50% { width: 80%; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  )
}
