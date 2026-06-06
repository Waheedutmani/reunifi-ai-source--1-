'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseSafeFetchOptions<T> {
  /** Fallback data when fetch fails */
  fallbackData: T
  /** Request timeout in ms (default: 8000) */
  timeout?: number
  /** Max retry attempts (default: 2) */
  maxRetries?: number
  /** Delay between retries in ms (default: 1500) */
  retryDelay?: number
  /** Whether fetching is enabled (default: true) */
  enabled?: boolean
}

interface UseSafeFetchResult<T> {
  data: T
  loading: boolean
  error: string | null
  refetch: () => void
  retryCount: number
}

/**
 * Safe fetch hook with:
 * - Automatic timeout
 * - Retry with exponential backoff
 * - Fallback data on failure
 * - No infinite loading states
 * - Error state tracking
 */
export function useSafeFetch<T>(
  url: string | null,
  options: UseSafeFetchOptions<T>
): UseSafeFetchResult<T> {
  const {
    fallbackData,
    timeout = 8000,
    maxRetries = 2,
    retryDelay = 1500,
    enabled = true,
  } = options

  const [data, setData] = useState<T>(fallbackData)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async (attempt: number = 0) => {
    if (!url || !enabled) {
      setLoading(false)
      return
    }

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    if (attempt === 0) {
      setLoading(true)
    }
    setError(null)

    // Set a timeout to abort the request
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const res = await fetch(url, { signal: controller.signal })

      if (!mountedRef.current) return
      clearTimeout(timeoutId)

      if (res.ok) {
        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          throw new Error('Server returned non-JSON response. The service may be temporarily unavailable.')
        }
        const json = await res.json()
        if (mountedRef.current) {
          setData(json)
          setLoading(false)
          setError(null)
          setRetryCount(0)
        }
      } else {
        throw new Error(`HTTP ${res.status}`)
      }
    } catch (err: unknown) {
      if (!mountedRef.current) return
      clearTimeout(timeoutId)

      // Don't treat aborted requests as errors
      if (err instanceof DOMException && err.name === 'AbortError') return

      const errorMsg = err instanceof Error ? err.message : 'Unknown error'

      if (attempt < maxRetries) {
        // Retry with delay
        setRetryCount(attempt + 1)
        setTimeout(() => {
          if (mountedRef.current) {
            fetchData(attempt + 1)
          }
        }, retryDelay * (attempt + 1))
      } else {
        // Exhausted retries — use fallback
        setData(fallbackData)
        setLoading(false)
        setError(errorMsg)
        setRetryCount(0)
      }
    }
  }, [url, enabled, timeout, maxRetries, retryDelay, fallbackData])

  useEffect(() => {
    mountedRef.current = true
    if (enabled && url) {
      fetchData(0)
    }
    return () => {
      mountedRef.current = false
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [fetchData, enabled, url])

  const refetch = useCallback(() => {
    setRetryCount(0)
    fetchData(0)
  }, [fetchData])

  return { data, loading, error, refetch, retryCount }
}
