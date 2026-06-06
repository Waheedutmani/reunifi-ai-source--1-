'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'

const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000 // Show warning 5 minutes before
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']

export function useSessionTimeout() {
  const logout = useAppStore((s) => s.logout)
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const lastActivityRef = useRef<number>(Date.now())
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const warningRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const warningShownRef = useRef(false)

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    warningShownRef.current = false
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    // Warning before timeout
    warningRef.current = setTimeout(() => {
      if (isAuthenticated && !warningShownRef.current) {
        warningShownRef.current = true
        const minutesLeft = Math.ceil((SESSION_TIMEOUT_MS - (Date.now() - lastActivityRef.current)) / 60000)
        console.log(`Session will expire in ${minutesLeft} minutes due to inactivity`)
      }
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS)

    // Auto logout
    timeoutRef.current = setTimeout(() => {
      if (isAuthenticated) {
        logout()
      }
    }, SESSION_TIMEOUT_MS)
  }, [isAuthenticated, logout])

  useEffect(() => {
    if (!isAuthenticated) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      return
    }

    resetTimer()

    const handleActivity = () => {
      resetTimer()
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true })
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity)
      }
    }
  }, [isAuthenticated, resetTimer])
}
