'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useAppStore } from '@/store/app-store'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { DashboardView } from '@/components/views/dashboard'
import { ReportMissingView } from '@/components/views/report-missing'
import { MissingListView } from '@/components/views/missing-list'
import { RegisterFoundView } from '@/components/views/register-found'
import { FoundListView } from '@/components/views/found-list'
import { MatchResultsView } from '@/components/views/match-results'
import { FaceCompareView } from '@/components/views/face-compare'
import { CaseTrackerView } from '@/components/views/case-tracker'
import { NotificationsView } from '@/components/views/notifications'
import { MapView } from '@/components/views/map-view'
import { AdminView } from '@/components/views/admin'
import { UsersView } from '@/components/views/users'
import { SettingsView } from '@/components/views/settings'
import { AnalyticsView } from '@/components/views/analytics'
import { InvestigationView } from '@/components/views/investigation'
import { MyReportsView } from '@/components/views/my-reports'
import { MatchStatusView } from '@/components/views/match-status'
import { ProfileView } from '@/components/views/profile'
import { AccessDeniedView } from '@/components/views/access-denied'
import { AIChatbot } from '@/components/chatbot/ai-chatbot'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useSessionTimeout } from '@/hooks/use-session-timeout'
import { canAccessView, getFallbackView, type RBACViewType } from '@/lib/rbac'
import { AIBackgroundEffects } from '@/components/effects/ai-background'
import { ErrorBoundary } from '@/components/error-boundary'
import { LoadingScreen } from '@/components/loading-screen'

// ─── View loading fallback (skeleton while view loads) ────────────────
function ViewLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-cyan-500" />
        <p className="text-xs text-muted-foreground">Loading view...</p>
      </div>
    </div>
  )
}

// ─── View error fallback (shown when a view crashes) ──────────────────
function ViewErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
        <span className="text-xl">⚠️</span>
      </div>
      <h3 className="text-sm font-semibold mb-1">View failed to load</h3>
      <p className="text-xs text-muted-foreground max-w-xs">
        This section encountered an error. Try navigating to a different page or refreshing.
      </p>
    </div>
  )
}

// ─── View Map (stable reference, no hook needed) ──────────────────────
const VIEW_MAP: Record<string, React.ComponentType> = {
  'dashboard': DashboardView,
  'report-missing': ReportMissingView,
  'missing-list': MissingListView,
  'register-found': RegisterFoundView,
  'found-list': FoundListView,
  'match-results': MatchResultsView,
  'face-compare': FaceCompareView,
  'case-tracker': CaseTrackerView,
  'notifications': NotificationsView,
  'map': MapView,
  'admin': AdminView,
  'users': UsersView,
  'settings': SettingsView,
  'analytics': AnalyticsView,
  'investigation': InvestigationView,
  'my-reports': MyReportsView,
  'match-status': MatchStatusView,
  'profile': ProfileView,
}

export default function Home() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const currentView = useAppStore((s) => s.currentView)
  const authMode = useAppStore((s) => s.authMode)
  const setAuthMode = useAppStore((s) => s.setAuthMode)
  const login = useAppStore((s) => s.login)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const currentUser = useAppStore((s) => s.currentUser)

  // App readiness — use ref to avoid setState-in-effect lint issue
  const readyRef = useRef(false)
  const [isReady, setIsReady] = useState(false)

  // Session timeout hook
  useSessionTimeout()

  // Mark app as ready after first mount (prevents hydration mismatch)
  // Also add a safety timeout so the loading screen never shows forever
  useEffect(() => {
    if (!readyRef.current) {
      readyRef.current = true
      // Use microtask to set state outside of effect sync execution
      Promise.resolve().then(() => setIsReady(true))
    }
    // Safety: force ready after 1.5 seconds even if microtask fails
    const safetyTimer = setTimeout(() => setIsReady(true), 1500)
    return () => clearTimeout(safetyTimer)
  }, [])

  // Global error handler for unhandled promise rejections
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.warn('[Reunifi] Unhandled promise rejection:', event.reason)
      event.preventDefault() // Prevent console error flood
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])

  // Seed demo data on first load (with timeout to prevent hanging)
  // Only seed once per session to avoid unnecessary API calls
  useEffect(() => {
    try {
      const alreadySeeded = sessionStorage.getItem('reunifi_seeded')
      if (alreadySeeded) return

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      fetch('/api/seed', { method: 'POST', signal: controller.signal })
        .then((res) => {
          if (res.ok) {
            try { sessionStorage.setItem('reunifi_seeded', '1') } catch { /* ignore */ }
          }
        })
        .catch(() => { /* Silently fail — seed is non-critical */ })
        .finally(() => clearTimeout(timeoutId))
    } catch {
      // sessionStorage not available — try seeding anyway
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      fetch('/api/seed', { method: 'POST', signal: controller.signal })
        .catch(() => { /* Silently fail */ })
        .finally(() => clearTimeout(timeoutId))
    }
  }, [])

  // Restore session from localStorage (safe parse)
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('reunifi_token')
      const savedUser = localStorage.getItem('reunifi_user')
      if (savedToken && savedUser && !isAuthenticated) {
        try {
          const user = JSON.parse(savedUser)
          if (user && typeof user === 'object' && user.id && user.email && user.role) {
            login(user, savedToken)
            navigateTo('dashboard')
          } else {
            // Invalid user data — clear corrupt data
            localStorage.removeItem('reunifi_token')
            localStorage.removeItem('reunifi_user')
          }
        } catch {
          // Invalid JSON — clear corrupt data
          localStorage.removeItem('reunifi_token')
          localStorage.removeItem('reunifi_user')
        }
      }
    } catch {
      // localStorage not available (SSR, privacy mode, etc.)
    }
  }, [])

  // RBAC: Redirect unauthorized views (with safety check)
  useEffect(() => {
    if (isAuthenticated && currentUser && currentView !== 'dashboard') {
      try {
        if (!canAccessView(currentUser.role, currentView as RBACViewType)) {
          const fallback = getFallbackView(currentUser.role)
          navigateTo(fallback as typeof currentView)
        }
      } catch {
        // RBAC check failed — redirect to dashboard as safe fallback
        navigateTo('dashboard')
      }
    }
  }, [currentView, isAuthenticated, currentUser, navigateTo])

  // Safety: ensure we never get stuck on a non-existent view
  useEffect(() => {
    if (isAuthenticated && currentView && !VIEW_MAP[currentView] && currentView !== 'login') {
      navigateTo('dashboard')
    }
  }, [currentView, isAuthenticated, navigateTo])

  // ─── Determine current view component (with safety fallback) ──────
  // No hooks called conditionally — this is just a derived value
  const hasAccess = !currentUser || canAccessView(currentUser.role, currentView as RBACViewType)
  const SafeViewComponent = hasAccess ? (VIEW_MAP[currentView] || DashboardView) : AccessDeniedView

  // Show global loading screen until app is hydrated
  if (!isReady) {
    return <LoadingScreen />
  }

  // ─── Unauthenticated: Login / Signup / Forgot Password ──────────────
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        {authMode === 'login' && (
          <LoginForm
            onSwitchToSignup={() => setAuthMode('signup')}
            onForgotPassword={() => setAuthMode('forgot-password')}
          />
        )}
        {authMode === 'signup' && (
          <SignupForm onSwitchToLogin={() => setAuthMode('login')} />
        )}
        {authMode === 'forgot-password' && (
          <ForgotPasswordForm onBackToLogin={() => setAuthMode('login')} />
        )}
        {authMode === 'reset-password' && (
          <ResetPasswordForm onBackToLogin={() => setAuthMode('login')} />
        )}
      </ErrorBoundary>
    )
  }

  // ─── Authenticated Layout ───────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-dvh overflow-hidden bg-background relative">
        {/* Futuristic AI Background Effects — wrapped in error boundary, auto-recovery */}
        <ErrorBoundary fallback={null} autoResetMs={3000} maxAutoResets={2}>
          <AIBackgroundEffects />
        </ErrorBoundary>

        {/* Sidebar — wrapped in error boundary */}
        <ErrorBoundary>
          <Sidebar />
        </ErrorBoundary>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0 relative z-10">
          {/* Header — wrapped in error boundary */}
          <ErrorBoundary>
            <Header />
          </ErrorBoundary>

          {/* Content — each view wrapped in error boundary + suspense */}
          <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-3 sm:p-4 md:p-6 max-w-full">
              <ErrorBoundary fallback={<ViewErrorFallback />}>
                <Suspense fallback={<ViewLoadingFallback />}>
                  <SafeViewComponent />
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-background/95 backdrop-blur-sm px-3 py-2 text-center text-[10px] sm:text-xs text-muted-foreground shrink-0 safe-bottom">
            Reunifi AI — AI-Powered Humanitarian Child Recovery Platform • Secure &amp; Confidential
          </footer>
        </div>

        {/* AI Chatbot Assistant — floating chatbot */}
        <ErrorBoundary>
          <AIChatbot />
        </ErrorBoundary>
      </div>
    </TooltipProvider>
  )
}
