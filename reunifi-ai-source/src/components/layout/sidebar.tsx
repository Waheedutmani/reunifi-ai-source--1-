'use client'

import { useAppStore, type ViewType } from '@/store/app-store'
import { cn } from '@/lib/utils'
import { getSidebarMenu, getRoleInfo, canAccessView, getFallbackView, type RBACViewType } from '@/lib/rbac'
import {
  Users,
  UserCheck,
  Eye,
  Brain,
  Bell,
  Shield,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Activity,
  ClipboardCheck,
  UserCog,
  X,
  Grid3X3,
  Radar,
  Cog,
  MapPin,
  ChartNoAxesCombined,
  Siren,
  Fingerprint,
  FolderClosed,
  ScrollText,
  Contact,
  Download,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-mobile'
import { useToast } from '@/hooks/use-toast'
import { useCallback, useState, useMemo, useEffect, useRef } from 'react'

// ─── Modern Icon Mapping ────────────────────────────────────────────
const ICON_MAP: Record<string, LucideIcon> = {
  'dashboard': Grid3X3,
  'report-missing': Siren,
  'missing-list': Users,
  'register-found': UserCheck,
  'found-list': Eye,
  'match-results': Brain,
  'face-compare': Fingerprint,
  'case-tracker': FolderClosed,
  'notifications': Bell,
  'map': MapPin,
  'admin': Shield,
  'users': UserCog,
  'settings': Cog,
  'analytics': ChartNoAxesCombined,
  'investigation': Radar,
  'my-reports': ScrollText,
  'match-status': ClipboardCheck,
  'profile': Contact,
}

// ─── Badge Data Hook ────────────────────────────────────────────────
// Fetches notification / counts for sidebar badges
// Optimized: timeout protection, sequential with early-exit, 90s polling
function useSidebarBadges(userId: string | undefined) {
  const [badges, setBadges] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!userId) return

    let cancelled = false

    async function safeFetchWithTimeout(url: string, timeoutMs: number = 6000): Promise<Response | null> {
      const controller = new AbortController()
      const tid = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await fetch(url, { signal: controller.signal })
        return res
      } catch {
        return null
      } finally {
        clearTimeout(tid)
      }
    }

    async function loadBadges() {
      try {
        const updates: Record<string, number> = {}

        // Fetch badges with timeout — parallel for speed, but each has timeout
        const [notifRes, missingRes, matchRes, casesRes] = await Promise.allSettled([
          safeFetchWithTimeout(`/api/notifications?userId=${userId}&limit=1`),
          safeFetchWithTimeout(`/api/missing?limit=1`),
          safeFetchWithTimeout(`/api/matching?limit=1`),
          safeFetchWithTimeout(`/api/cases?limit=1`),
        ])

        if (cancelled) return

        // Process notification count
        if (notifRes.status === 'fulfilled' && notifRes.value?.ok) {
          try {
            const notifData = await notifRes.value.json()
            updates.notifications = notifData.unreadCount || 0
          } catch { /* parse error */ }
        }

        // Process missing children count
        if (missingRes.status === 'fulfilled' && missingRes.value?.ok) {
          try {
            const missingData = await missingRes.value.json()
            updates['missing-list'] = missingData.total ?? (Array.isArray(missingData.data) ? missingData.data.length : 0)
          } catch { /* parse error */ }
        }

        // Process match results count
        if (matchRes.status === 'fulfilled' && matchRes.value?.ok) {
          try {
            const matchData = await matchRes.value.json()
            updates['match-results'] = matchData.total ?? (Array.isArray(matchData.data) ? matchData.data.length : 0)
          } catch { /* parse error */ }
        }

        // Process cases count
        if (casesRes.status === 'fulfilled' && casesRes.value?.ok) {
          try {
            const casesData = await casesRes.value.json()
            updates['case-tracker'] = casesData.total ?? (Array.isArray(casesData.data) ? casesData.data.length : 0)
          } catch { /* parse error */ }
        }

        if (!cancelled) {
          setBadges(prev => ({ ...prev, ...updates }))
        }
      } catch {
        // Silently fail — badges are non-critical UI
      }
    }

    loadBadges()
    const interval = setInterval(loadBadges, 90000) // Refresh every 90s (reduced from 60s)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [userId])

  return badges
}

// ─── Shared: Sidebar Navigation Content ─────────────────────────────
function SidebarNavContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean
  onNavigate: (viewId: RBACViewType) => void
}) {
  const currentView = useAppStore((s) => s.currentView)
  const currentUser = useAppStore((s) => s.currentUser)
  const logout = useAppStore((s) => s.logout)
  const { toast } = useToast()

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Download state
  const [downloadingSource, setDownloadingSource] = useState(false)

  const handleDownloadSource = useCallback(async () => {
    setDownloadingSource(true)
    try {
      const res = await fetch('/api/download-source')
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'reunifi-ai-source.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: 'Download Started',
        description: 'Source code ZIP is being downloaded.',
      })
    } catch {
      toast({
        title: 'Download Failed',
        description: 'Could not download source code. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setDownloadingSource(false)
    }
  }, [toast])

  const userRole = currentUser?.role || 'parent'
  const roleInfo = getRoleInfo(userRole)
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  // Fetch badges for menu items
  const badges = useSidebarBadges(currentUser?.id)

  // Get role-specific sidebar menu
  const sidebarMenu = getSidebarMenu(userRole)

  // Handle navigation with RBAC check
  const handleNavigate = useCallback((viewId: RBACViewType) => {
    if (canAccessView(userRole, viewId)) {
      onNavigate(viewId as ViewType)
    } else {
      const fallback = getFallbackView(userRole)
      onNavigate(fallback as ViewType)
    }
  }, [userRole, onNavigate])

  // Filter menu items based on search query
  const filteredMenu = useMemo(() => {
    if (!searchQuery.trim()) return sidebarMenu
    const query = searchQuery.toLowerCase().trim()
    return sidebarMenu.filter(item =>
      item.label.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      (item.section && item.section.toLowerCase().includes(query))
    )
  }, [sidebarMenu, searchQuery])

  // Group items by section
  const groupedItems = useMemo(() => {
    const groups: { section: string | null; items: typeof filteredMenu }[] = []
    let currentSection: string | null = null
    let currentGroup: { section: string | null; items: typeof filteredMenu } = { section: null, items: [] }

    for (const item of filteredMenu) {
      if (item.section !== currentSection) {
        if (currentGroup.items.length > 0) {
          groups.push(currentGroup)
        }
        currentSection = item.section || null
        currentGroup = { section: currentSection, items: [item] }
      } else {
        currentGroup.items.push(item)
      }
    }
    if (currentGroup.items.length > 0) {
      groups.push(currentGroup)
    }
    return groups
  }, [filteredMenu])

  // Keyboard shortcut: Escape to clear search
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchQuery('')
      searchInputRef.current?.blur()
    }
  }, [])

  const hasSearchResults = filteredMenu.length > 0

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Search Bar — only when expanded */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1 shrink-0">
          <div className={cn(
            'relative flex items-center rounded-lg border transition-all duration-200',
            searchFocused
              ? 'border-cyan-400/40 bg-sidebar sidebar-3d-search-focus'
              : 'border-sidebar-border bg-sidebar-accent/40'
          )}>
            <Search className={cn(
              'absolute left-2.5 h-3.5 w-3.5 transition-colors duration-200',
              searchFocused ? 'text-cyan-400' : 'text-muted-foreground/50'
            )} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={handleSearchKeyDown}
              className="h-8 w-full bg-transparent pl-8 pr-7 text-xs text-sidebar-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 flex h-4 w-4 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collapsed search icon button */}
      {collapsed && (
        <div className="px-2 pt-3 pb-1 shrink-0 flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200 min-w-[44px] min-h-[44px]"
                onClick={() => {
                  // Expand sidebar and focus search
                  const store = useAppStore.getState()
                  store.setSidebarCollapsed(false)
                  setTimeout(() => searchInputRef.current?.focus(), 350)
                }}
              >
                <Search className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>Search menu</TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Scrollable Navigation — smooth scroll, elegant scrollbar */}
      <div className="flex-1 overflow-y-auto overscroll-contain scroll-smooth sidebar-scroll-area px-2 py-2">
        {/* No results state */}
        <AnimatePresence mode="wait">
          {!hasSearchResults && searchQuery && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex flex-col items-center justify-center py-8 text-muted-foreground/50"
            >
              <Search className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs font-medium">No menu found</p>
              <p className="text-[10px] mt-0.5">Try a different search</p>
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="flex flex-col gap-0.5">
          {groupedItems.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Section Header */}
              {group.section && !collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: groupIndex * 0.03, duration: 0.2 }}
                  className="px-3 pt-4 pb-1.5 first:pt-2"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">
                    {group.section}
                  </span>
                </motion.div>
              )}

              {/* Section Separator (when collapsed) */}
              {group.section && collapsed && groupIndex > 0 && (
                <Separator className="my-1.5 bg-sidebar-border/20 mx-2" />
              )}

              {/* Menu Items */}
              {group.items.map((item, itemIndex) => {
                const isActive = currentView === item.id
                const Icon = ICON_MAP[item.id] || Activity
                const viewId = item.id as RBACViewType
                const badgeCount = badges[item.id] || 0

                const navButton = (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(viewId)}
                    className={cn(
                      'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium min-h-[44px]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar',
                      'sidebar-3d-item',
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 sidebar-3d-active sidebar-3d-active-pulse'
                        : 'text-sidebar-foreground/55 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/90'
                    )}
                  >
                    {/* Active indicator bar — neon cyan left edge */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active-bar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-cyan-400 to-cyan-600 shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}

                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] shrink-0 transition-all duration-200',
                        isActive
                          ? 'text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_4px_rgba(34,211,238,0.4)]'
                          : 'text-sidebar-foreground/35 group-hover:text-sidebar-foreground/65 group-hover:scale-105'
                      )}
                    />

                    {!collapsed && (
                      <>
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.12, delay: itemIndex * 0.015 }}
                          className="truncate flex-1 text-left"
                        >
                          {item.label}
                        </motion.span>

                        {/* Notification badge — 3D pop */}
                        {badgeCount > 0 && !isActive && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className={cn(
                              'ml-auto shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold leading-none sidebar-3d-badge',
                              item.id === 'notifications'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            )}
                          >
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </motion.span>
                        )}

                        {/* Active dot indicator — cyan glow */}
                        {isActive && (
                          <motion.div
                            layoutId="activeDot"
                            className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          />
                        )}
                      </>
                    )}

                    {/* Badge on collapsed — small dot on icon */}
                    {collapsed && badgeCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white px-1 leading-none shadow-sm">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </button>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={8} className="flex items-center gap-2 font-medium">
                        {item.label}
                        {badgeCount > 0 && (
                          <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1 text-[10px] font-bold">
                            {badgeCount}
                          </span>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return navButton
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile Section — pinned to bottom, 3D depth */}
      <div className="shrink-0 border-t border-sidebar-border/60 bg-sidebar/80 backdrop-blur-sm sidebar-3d-profile">
        <div className="flex items-center gap-2.5 p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleNavigate('profile' as RBACViewType)}
                className="flex items-center gap-2.5 flex-1 min-w-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 rounded-lg px-0.5 transition-all duration-200 hover:bg-sidebar-accent/40 sidebar-3d-cyan-border"
              >
                <Avatar className="h-8 w-8 shrink-0 border-2 border-cyan-400/20 shadow-sm transition-all duration-200 hover:shadow-[0_0_12px_rgba(34,211,238,0.15)] hover:border-cyan-400/40">
                  <AvatarFallback className={cn('text-[11px] font-bold', roleInfo.bgColor, roleInfo.color)}>
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-1 flex-col overflow-hidden"
                  >
                    <span className="truncate text-sm font-semibold text-sidebar-foreground leading-tight">
                      {currentUser?.name || 'User'}
                    </span>
                    <span className={cn('truncate text-[10px] font-semibold uppercase tracking-wide', roleInfo.color)}>
                      {roleInfo.label}
                    </span>
                  </motion.div>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              <div className="flex flex-col">
                <span className="font-semibold">{currentUser?.name || 'User'}</span>
                <span className="text-xs text-muted-foreground">{roleInfo.label}</span>
              </div>
            </TooltipContent>
          </Tooltip>

          {!collapsed && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-sidebar-foreground/30 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all duration-200 min-w-[36px] min-h-[36px] rounded-lg"
                    onClick={handleDownloadSource}
                    disabled={downloadingSource}
                  >
                    {downloadingSource ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Download Source Code</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-sidebar-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 min-w-[36px] min-h-[36px] rounded-lg"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Sign Out</TooltipContent>
              </Tooltip>
            </>
          )}

          {collapsed && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-sidebar-foreground/30 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all duration-200 min-w-[36px] min-h-[36px] rounded-lg"
                    onClick={handleDownloadSource}
                    disabled={downloadingSource}
                  >
                    {downloadingSource ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Download Source Code</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-sidebar-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 min-w-[36px] min-h-[36px] rounded-lg"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign Out</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Desktop Sidebar (fixed aside with collapse) ───────────────────
function DesktopSidebar() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed)
  const navigateTo = useAppStore((s) => s.navigateTo)

  return (
    <aside
      className={cn(
        'relative z-10 hidden md:flex h-full flex-col border-r border-sidebar-border/60 bg-sidebar transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] sidebar-3d-container',
        sidebarCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo & App Name + Collapse Toggle */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border/60 px-3 shrink-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 sidebar-3d-logo">
          <Shield className="h-5 w-5 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]" />
        </div>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <span className="text-[13px] font-bold text-sidebar-foreground tracking-tight leading-tight">
              Reunifi AI
            </span>
            <span className="text-[9px] text-muted-foreground/60 leading-tight font-medium">
              Child Recovery Platform
            </span>
          </motion.div>
        )}

        {/* Collapse/Expand Toggle Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                'shrink-0 text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 h-7 w-7',
                sidebarCollapsed && 'ml-auto'
              )}
              aria-label={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {sidebarCollapsed ? (
                  <motion.div
                    key="expand"
                    initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="collapse"
                    initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Navigation Content — scrollable area */}
      <SidebarNavContent
        collapsed={sidebarCollapsed}
        onNavigate={(viewId) => navigateTo(viewId as ViewType)}
      />
    </aside>
  )
}

// ─── Mobile Sidebar (Sheet drawer with slide-in + overlay) ─────────
function MobileSidebar() {
  const mobileMenuOpen = useAppStore((s) => s.mobileMenuOpen)
  const setMobileMenuOpen = useAppStore((s) => s.setMobileMenuOpen)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const currentUser = useAppStore((s) => s.currentUser)
  const logout = useAppStore((s) => s.logout)
  const roleInfo = getRoleInfo(currentUser?.role || 'parent')
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent
        side="left"
        className="w-[280px] sm:w-[300px] p-0 gap-0 bg-sidebar border-sidebar-border"
      >
        {/* Logo Header */}
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <div className="flex h-14 items-center gap-3 border-b border-sidebar-border/60 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 sidebar-3d-logo">
            <Shield className="h-5 w-5 text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.3)]" />
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="text-[13px] font-bold text-sidebar-foreground tracking-tight leading-tight">
              Reunifi AI
            </span>
            <span className="text-[9px] text-muted-foreground/60 leading-tight font-medium">
              Child Recovery Platform
            </span>
          </div>
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-sidebar-foreground/30 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-8 w-8 min-w-[44px] min-h-[44px] rounded-lg"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Content - always expanded on mobile, auto-close on navigate */}
        <SidebarNavContent
          collapsed={false}
          onNavigate={(viewId) => {
            navigateTo(viewId as ViewType)
            setMobileMenuOpen(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Sidebar Export ────────────────────────────────────────────
export function Sidebar() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileSidebar />
  }

  return <DesktopSidebar />
}
