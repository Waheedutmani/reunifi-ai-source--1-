'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  /** Auto-reset the error boundary after this many ms (default: 5000ms for auto-recovery) */
  autoResetMs?: number
  /** Called when the boundary catches an error */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Maximum auto-reset attempts before giving up (default: 3) */
  maxAutoResets?: number
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorCount: number
  autoResetCount: number
}

/**
 * Enhanced ErrorBoundary with auto-recovery, auto-reset limits, and graceful degradation.
 * 
 * - Auto-resets after autoResetMs (default 5000ms) to recover from transient errors
 * - Limits auto-reset attempts to maxAutoResets (default 3) to prevent infinite loops
 * - Shows helpful UI with retry button
 * - Supports custom fallback (pass null to hide errors completely)
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private autoResetTimer: ReturnType<typeof setTimeout> | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorCount: 0, autoResetCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }))
    this.props.onError?.(error, errorInfo)

    // Auto-reset if configured (default: 5000ms for auto-recovery)
    const resetMs = this.props.autoResetMs ?? 5000
    const maxResets = this.props.maxAutoResets ?? 3

    if (resetMs > 0 && this.state.autoResetCount < maxResets) {
      this.autoResetTimer = setTimeout(() => {
        this.setState(prev => ({
          hasError: false,
          error: null,
          autoResetCount: prev.autoResetCount + 1,
        }))
      }, resetMs)
    }
  }

  componentWillUnmount() {
    if (this.autoResetTimer) {
      clearTimeout(this.autoResetTimer)
    }
  }

  handleRetry = () => {
    if (this.autoResetTimer) {
      clearTimeout(this.autoResetTimer)
      this.autoResetTimer = null
    }
    this.setState({ hasError: false, error: null, autoResetCount: 0 })
  }

  render() {
    if (this.state.hasError) {
      // Allow custom fallback (including null to hide errors completely)
      if (this.props.fallback !== undefined) {
        return this.props.fallback
      }

      const isRepeated = this.state.errorCount > 2
      const maxResetsReached = this.state.autoResetCount >= (this.props.maxAutoResets ?? 3)

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30 mb-4">
            <AlertTriangle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {isRepeated ? 'Repeated Error Detected' : 'Something went wrong'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs mb-4">
            {maxResetsReached
              ? 'Auto-recovery attempts exhausted. Please refresh the page or click retry.'
              : isRepeated
                ? 'This section keeps encountering errors. Try refreshing the page.'
                : 'This section encountered an error. It will auto-retry shortly.'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
            {(isRepeated || maxResetsReached) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                Refresh Page
              </Button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
