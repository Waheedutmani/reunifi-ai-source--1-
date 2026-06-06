'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { Menu, Search, Bell, Moon, Sun, LogOut, User, Info, Brain, Siren, CheckCheck, ExternalLink, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useTheme } from 'next-themes'
import { useToast } from '@/hooks/use-toast'
import { useIsMobile } from '@/hooks/use-mobile'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  relatedId: string | null
  relatedType: string | null
  createdAt: string
}

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'match':
      return <Brain className="h-4 w-4 text-emerald-500" />
    case 'emergency':
      return <Siren className="h-4 w-4 text-red-500" />
    case 'alert':
      return <Bell className="h-4 w-4 text-amber-500" />
    default:
      return <Info className="h-4 w-4 text-sky-500" />
  }
}

function getNotificationBg(type: string) {
  switch (type) {
    case 'match':
      return 'bg-emerald-50 dark:bg-emerald-950/30'
    case 'emergency':
      return 'bg-red-50 dark:bg-red-950/30'
    case 'alert':
      return 'bg-amber-50 dark:bg-amber-950/30'
    default:
      return 'bg-sky-50 dark:bg-sky-950/30'
  }
}

export function Header() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((s) => s.setSidebarCollapsed)
  const setMobileMenuOpen = useAppStore((s) => s.setMobileMenuOpen)
  const currentUser = useAppStore((s) => s.currentUser)
  const logout = useAppStore((s) => s.logout)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const isMobile = useIsMobile()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [prevUnreadCount, setPrevUnreadCount] = useState(0)
  const [isPulsing, setIsPulsing] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [downloadingSource, setDownloadingSource] = useState(false)

  // Search state
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  // Fetch notifications with timeout protection
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000)
      const res = await fetch(`/api/notifications?userId=${currentUser.id}&limit=5`, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (res.ok) {
        const json = await res.json()
        const newNotifications: NotificationItem[] = json.data || []
        const newUnreadCount: number = json.unreadCount || 0

        if (newUnreadCount > prevUnreadCount && prevUnreadCount > 0) {
          const newOnes = newNotifications.filter(
            (n) => !n.read && (n.type === 'match' || n.type === 'emergency')
          )
          newOnes.slice(0, 2).forEach((n) => {
            toast({
              title: n.type === 'emergency' ? `🚨 EMERGENCY: ${n.title}` : `🤖 AI Match: ${n.title}`,
              description: n.message.length > 80 ? n.message.slice(0, 80) + '...' : n.message,
              variant: n.type === 'emergency' ? 'destructive' : undefined,
            })
          })
        }

        setNotifications(newNotifications)
        setPrevUnreadCount(unreadCount)
        setUnreadCount(newUnreadCount)

        if (newUnreadCount > unreadCount) {
          setIsPulsing(true)
          setTimeout(() => setIsPulsing(false), 2000)
        }
      }
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [currentUser?.id, unreadCount, prevUnreadCount, toast])

  // Initial fetch + polling (45s interval)
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 45000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Keyboard shortcut Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isMobile) {
          setSearchDialogOpen(true)
        } else {
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobile])

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (!currentUser?.id || markingAll) return
    setMarkingAll(true)
    try {
      const res = await fetch(`/api/notifications?markAll=true&userId=${currentUser.id}`, {
        method: 'PUT',
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch {
      // Silently fail
    } finally {
      setMarkingAll(false)
    }
  }

  // Mark single as read
  const handleMarkRead = async (notifId: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${notifId}`, {
        method: 'PUT',
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch {
      // Silently fail
    }
  }

  const handleDownloadSource = async () => {
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
  }

  const handleMenuToggle = () => {
    if (isMobile) {
      setMobileMenuOpen(true)
    } else {
      setSidebarCollapsed(!sidebarCollapsed)
    }
  }

  return (
    <header className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-background/95 backdrop-blur-sm px-3 sm:px-6">
      {/* Sidebar Toggle - visible on all screen sizes */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-200 min-w-[44px] min-h-[44px]"
        onClick={handleMenuToggle}
        aria-label={isMobile ? 'Open navigation menu' : sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <motion.div
          animate={{ rotate: (!isMobile && !sidebarCollapsed) ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <Menu className="h-5 w-5" />
        </motion.div>
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Desktop Search Bar */}
      <div className="relative hidden md:flex flex-1 max-w-md">
        <motion.div
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
          animate={{
            scale: searchFocused ? 1.1 : 1,
            rotate: searchFocused ? 90 : 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Search className={`h-4 w-4 transition-colors ${searchFocused ? 'text-cyan-400' : 'text-muted-foreground'}`} />
        </motion.div>
        <Input
          ref={searchInputRef}
          type="search"
          placeholder="Search children, cases, reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="pl-9 pr-16 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-cyan-400/50 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      {/* Mobile Search Button */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0 text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px]"
        onClick={() => setSearchDialogOpen(true)}
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1 md:hidden" />

      {/* Right Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px]"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notification Bell with Popover */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px]"
            >
              <AnimatePresence>
                {isPulsing && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-amber-400/20"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    exit={{ scale: 1.4, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: 1 }}
                  />
                )}
              </AnimatePresence>
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  key={unreadCount}
                >
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center bg-amber-500 text-white text-[9px] font-bold border-0">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                </motion.div>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-0 rounded-xl shadow-lg border"
            align="end"
            sideOffset={8}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">Notifications</h4>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  {markingAll ? 'Marking...' : 'Mark all read'}
                </Button>
              )}
            </div>

            {/* Notification List */}
            <ScrollArea className="max-h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif, index) => (
                    <div key={notif.id}>
                      <div
                        className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                          !notif.read ? 'bg-muted/30' : ''
                        }`}
                        onClick={() => {
                          if (!notif.read) handleMarkRead(notif.id)
                        }}
                      >
                        {/* Icon */}
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getNotificationBg(notif.type)}`}>
                          {getNotificationIcon(notif.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm leading-tight ${!notif.read ? 'font-semibold' : 'font-medium text-muted-foreground'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {getRelativeTime(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                      {index < notifications.length - 1 && <Separator className="mx-4" />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 h-8 min-h-[44px]"
                onClick={() => {
                  setNotifOpen(false)
                  navigateTo('notifications')
                }}
              >
                View All Notifications
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full min-w-[44px] min-h-[44px]">
              <Avatar className="h-9 w-9 border-2 border-cyan-200 dark:border-cyan-800">
                <AvatarFallback className="bg-cyan-100 text-cyan-700 text-xs font-semibold dark:bg-cyan-900 dark:text-cyan-300">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser?.email || 'user@example.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigateTo('dashboard')} className="min-h-[44px]">
              <User className="mr-2 h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigateTo('notifications')} className="min-h-[44px]">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadSource} disabled={downloadingSource} className="min-h-[44px]">
              {downloadingSource ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloadingSource ? 'Downloading...' : 'Download Source Code'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive min-h-[44px]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Search Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="sm:max-w-md top-4 translate-y-0 p-0 gap-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center border-b px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
            <Input
              ref={mobileSearchInputRef}
              type="search"
              placeholder="Search children, cases, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 p-0 h-auto text-base placeholder:text-muted-foreground/60"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-8 w-8 p-0 shrink-0"
              onClick={() => setSearchDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4 text-sm text-muted-foreground">
            <p className="text-center">Type to search across children, cases, and reports</p>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
