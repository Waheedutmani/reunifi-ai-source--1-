import { create } from 'zustand'
import { getDefaultView } from '@/lib/rbac'

export type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password'

export type ViewType = 
  | 'dashboard'
  | 'report-missing'
  | 'missing-list'
  | 'register-found'
  | 'found-list'
  | 'match-results'
  | 'face-compare'
  | 'case-tracker'
  | 'notifications'
  | 'admin'
  | 'map'
  | 'login'
  | 'signup'
  // RBAC new views
  | 'users'
  | 'settings'
  | 'analytics'
  | 'investigation'
  | 'my-reports'
  | 'match-status'
  | 'profile'

export interface AppUser {
  id: string
  email: string
  name: string
  role: string
  avatar?: string
  phone?: string
  organization?: string
  verified: boolean
}

interface AppState {
  // Auth
  currentUser: AppUser | null
  isAuthenticated: boolean
  authMode: AuthMode
  authToken: string | null
  setAuthMode: (mode: AuthMode) => void
  login: (user: AppUser, token?: string) => void
  logout: () => void

  // Navigation
  currentView: ViewType
  navigateTo: (view: ViewType) => void

  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  sidebarCollapsed: boolean // Desktop collapse state (icon-only mode)
  setSidebarCollapsed: (collapsed: boolean) => void
  mobileMenuOpen: boolean // Mobile sheet drawer state
  setMobileMenuOpen: (open: boolean) => void
  
  // Selected items
  selectedMissingChildId: string | null
  setSelectedMissingChildId: (id: string | null) => void
  selectedFoundChildId: string | null
  setSelectedFoundChildId: (id: string | null) => void
  selectedMatchId: string | null
  setSelectedMatchId: (id: string | null) => void
  selectedCaseId: string | null
  setSelectedCaseId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  currentUser: null,
  isAuthenticated: false,
  authMode: 'login',
  authToken: null,
  setAuthMode: (mode) => set({ authMode: mode }),
  login: (user, token) => {
    // Store token in localStorage for persistence
    if (token) {
      try {
        localStorage.setItem('reunifi_token', token)
        localStorage.setItem('reunifi_user', JSON.stringify(user))
      } catch {
        // localStorage not available
      }
    }
    // Redirect to role-specific dashboard after login
    const defaultView = getDefaultView(user.role)
    set({ currentUser: user, isAuthenticated: true, currentView: defaultView as ViewType, authToken: token || null, mobileMenuOpen: false })
  },
  logout: () => {
    try {
      localStorage.removeItem('reunifi_token')
      localStorage.removeItem('reunifi_user')
    } catch {
      // localStorage not available
    }
    set({ currentUser: null, isAuthenticated: false, currentView: 'login', authMode: 'login', authToken: null, mobileMenuOpen: false })
  },

  // Navigation
  currentView: 'login',
  navigateTo: (view) => set({ currentView: view, mobileMenuOpen: false }),

  // UI State
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Selected items
  selectedMissingChildId: null,
  setSelectedMissingChildId: (id) => set({ selectedMissingChildId: id }),
  selectedFoundChildId: null,
  setSelectedFoundChildId: (id) => set({ selectedFoundChildId: id }),
  selectedMatchId: null,
  setSelectedMatchId: (id) => set({ selectedMatchId: id }),
  selectedCaseId: null,
  setSelectedCaseId: (id) => set({ selectedCaseId: id }),
}))
