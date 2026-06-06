'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/store/app-store'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
  Bell,
  Info,
  Brain,
  AlertTriangle,
  Siren,
  CheckCheck,
  BellOff,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

interface NotificationItem {
  id: string
  userId: string
  title: string
  message: string
  type: string
  read: boolean
  relatedId: string | null
  relatedType: string | null
  createdAt: string
}

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  alert: Bell,
  match: Brain,
  emergency: Siren,
}

const typeColors: Record<string, string> = {
  info: 'text-teal-500',
  alert: 'text-amber-500',
  match: 'text-emerald-500',
  emergency: 'text-rose-500',
}

const typeBgColors: Record<string, string> = {
  info: 'bg-teal-50 dark:bg-teal-950/30',
  alert: 'bg-amber-50 dark:bg-amber-950/30',
  match: 'bg-emerald-50 dark:bg-emerald-950/30',
  emergency: 'bg-rose-50 dark:bg-rose-950/30',
}

const borderColors: Record<string, string> = {
  info: 'border-l-teal-400',
  alert: 'border-l-amber-400',
  match: 'border-l-emerald-400',
  emergency: 'border-l-rose-500',
}

function NotificationSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <BellOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">No notifications</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        You&apos;re all caught up! New notifications will appear here.
      </p>
    </div>
  )
}

export function NotificationsView() {
  const currentUser = useAppStore((s) => s.currentUser)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const setSelectedMissingChildId = useAppStore((s) => s.setSelectedMissingChildId)
  const setSelectedFoundChildId = useAppStore((s) => s.setSelectedFoundChildId)
  const setSelectedMatchId = useAppStore((s) => s.setSelectedMatchId)
  const { toast } = useToast()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      setLoading(true)
      const params = new URLSearchParams({ userId: currentUser.id, limit: '100' })
      if (activeTab === 'unread') params.set('unread', 'true')
      else if (activeTab !== 'all') params.set('type', activeTab)

      const res = await fetch(`/api/notifications?${params}`)
      if (res.ok) {
        const json = await res.json()
        setNotifications(json.data || [])
        setUnreadCount(json.unreadCount || 0)
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load notifications', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, activeTab])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'PUT' })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to mark notification as read', variant: 'destructive' })
    }
  }

  const markAllAsRead = async () => {
    if (!currentUser?.id) return
    try {
      const res = await fetch(`/api/notifications?markAll=true&userId=${currentUser.id}`, { method: 'PUT' })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
        toast({ title: 'Success', description: 'All notifications marked as read' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to mark all as read', variant: 'destructive' })
    }
  }

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // Navigate to related item
    if (notification.relatedType === 'missing' && notification.relatedId) {
      setSelectedMissingChildId(notification.relatedId)
      navigateTo('missing-list')
    } else if (notification.relatedType === 'found' && notification.relatedId) {
      setSelectedFoundChildId(notification.relatedId)
      navigateTo('found-list')
    } else if (notification.relatedType === 'match' && notification.relatedId) {
      setSelectedMatchId(notification.relatedId)
      navigateTo('match-results')
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !n.read
    return n.type === activeTab
  })

  const isEmergency = (type: string) => type === 'emergency'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 shadow-lg">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">Notifications & Alerts</h1>
            <p className="text-sm text-muted-foreground">
              Stay updated on cases, matches, and emergencies
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {unreadCount} unread
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="gap-1.5 min-h-[44px]"
              >
                <CheckCheck className="h-4 w-4" />
                Mark all read
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            All
          </TabsTrigger>
          <TabsTrigger value="unread" className="text-xs sm:text-sm relative">
            Unread
            {unreadCount > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="alert" className="text-xs sm:text-sm">
            Alerts
          </TabsTrigger>
          <TabsTrigger value="match" className="text-xs sm:text-sm">
            Matches
          </TabsTrigger>
          <TabsTrigger value="emergency" className="text-xs sm:text-sm">
            Emergency
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card className="glass-card border-0 rounded-xl shadow-sm">
            <ScrollArea className="max-h-[calc(100vh-320px)]">
              {loading ? (
                <div className="divide-y">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <NotificationSkeleton key={i} />
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="divide-y">
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((notification, index) => {
                      const Icon = typeIcons[notification.type] || Info
                      const colorClass = typeColors[notification.type] || 'text-muted-foreground'
                      const bgClass = typeBgColors[notification.type] || 'bg-muted'
                      const borderClass = borderColors[notification.type] || 'border-l-muted'
                      const emergency = isEmergency(notification.type)

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.03, duration: 0.25 }}
                          className={`
                            relative cursor-pointer glass-notification rounded-lg mx-2 my-1
                            border-l-4 ${borderClass}
                            ${!notification.read ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}
                            ${emergency && !notification.read ? 'animate-pulse' : ''}
                          `}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex gap-3 p-4">
                            {/* Icon */}
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bgClass}`}>
                              <Icon className={`h-5 w-5 ${colorClass}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`text-sm font-semibold leading-tight ${!notification.read ? 'text-foreground' : 'text-foreground/70'}`}>
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <span className="mt-1 shrink-0 h-2.5 w-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 pt-0.5">
                                <span className="text-xs text-muted-foreground/70">
                                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                                {notification.type && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] px-1.5 py-0 h-4 ${colorClass} border-current/20`}
                                  >
                                    {notification.type}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Emergency pulse overlay */}
                          {emergency && !notification.read && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 animate-pulse rounded-l" />
                          )}
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', count: notifications.length, icon: Bell, color: 'text-foreground' },
          { label: 'Unread', count: unreadCount, icon: AlertTriangle, color: 'text-amber-500' },
          { label: 'Matches', count: notifications.filter((n) => n.type === 'match').length, icon: Brain, color: 'text-emerald-500' },
          { label: 'Emergency', count: notifications.filter((n) => n.type === 'emergency').length, icon: Siren, color: 'text-rose-500' },
        ].map((stat) => (
          <Card key={stat.label} className="glass-stat glass-card-shimmer glass-card-glow-amber border-0 rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stat.count}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
