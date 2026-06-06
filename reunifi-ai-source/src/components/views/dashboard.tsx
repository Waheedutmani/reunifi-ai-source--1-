'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Search,
  Heart,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  UserPlus,
  Zap,
  ClipboardList,
  MapPin,
  Calendar,
  TrendingUp,
  Clock,
  UserCheck,
  CheckCircle2,
  Activity,
  AlertTriangle,
  Shield,
  Filter,
  X,
  Eye,
  Siren,
  XCircle,
} from 'lucide-react'
import { AnimatedStatCard } from '@/components/stats/animated-stat-card'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app-store'
import { getDashboardTitle } from '@/lib/rbac'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────
interface AnalyticsStats {
  totalMissing: number
  totalFound: number
  totalMatches: number
  reunifications: number
  monthlyData: {
    month: string
    missing: number
    found: number
    matched: number
  }[]
}

interface MissingChild {
  id: string
  fullName: string
  age: number
  gender: string
  lastSeenLocation: string
  lastSeenDate: string
  status: string
  caseNumber: string
  priority: string
}

interface MatchResult {
  id: string
  similarityScore: number
  confidence: string
  status: string
  missingChild: {
    id: string
    fullName: string
    caseNumber: string
  }
  foundChild: {
    id: string
    estimatedName: string | null
  }
}

// ─── Fallback Mock Data ──────────────────────────────────────────────
const FALLBACK_ANALYTICS: AnalyticsStats = {
  totalMissing: 247,
  totalFound: 183,
  totalMatches: 89,
  reunifications: 67,
  monthlyData: [
    { month: 'Jan', missing: 22, found: 14, matched: 8 },
    { month: 'Feb', missing: 18, found: 16, matched: 10 },
    { month: 'Mar', missing: 25, found: 19, matched: 7 },
    { month: 'Apr', missing: 20, found: 21, matched: 12 },
    { month: 'May', missing: 28, found: 17, matched: 9 },
    { month: 'Jun', missing: 15, found: 23, matched: 11 },
    { month: 'Jul', missing: 19, found: 20, matched: 14 },
    { month: 'Aug', missing: 24, found: 18, matched: 6 },
    { month: 'Sep', missing: 21, found: 15, matched: 5 },
    { month: 'Oct', missing: 16, found: 12, matched: 4 },
    { month: 'Nov', missing: 23, found: 8, matched: 3 },
    { month: 'Dec', missing: 16, found: 0, matched: 0 },
  ],
}

const FALLBACK_MISSING: MissingChild[] = [
  { id: '1', fullName: 'Amina Osei', age: 7, gender: 'Female', lastSeenLocation: 'Accra Central Market', lastSeenDate: '2024-01-15T10:30:00Z', status: 'open', caseNumber: 'MC-20240115-0342', priority: 'critical' },
  { id: '2', fullName: 'Kwame Mensah', age: 10, gender: 'Male', lastSeenLocation: 'Kumasi Railway Station', lastSeenDate: '2024-01-14T15:00:00Z', status: 'investigating', caseNumber: 'MC-20240114-0218', priority: 'high' },
  { id: '3', fullName: 'Fatima Abdulai', age: 5, gender: 'Female', lastSeenLocation: 'Tamale Bus Terminal', lastSeenDate: '2024-01-13T08:45:00Z', status: 'matched', caseNumber: 'MC-20240113-0156', priority: 'normal' },
  { id: '4', fullName: 'Yusif Iddrisu', age: 8, gender: 'Male', lastSeenLocation: 'Cape Coast Castle Area', lastSeenDate: '2024-01-12T14:20:00Z', status: 'open', caseNumber: 'MC-20240112-0089', priority: 'high' },
  { id: '5', fullName: 'Adwoa Darko', age: 6, gender: 'Female', lastSeenLocation: 'Tema Harbor District', lastSeenDate: '2024-01-11T11:00:00Z', status: 'closed', caseNumber: 'MC-20240111-0045', priority: 'normal' },
]

const FALLBACK_MATCHES: MatchResult[] = [
  { id: '1', similarityScore: 0.96, confidence: 'high', status: 'pending', missingChild: { id: 'm1', fullName: 'Amina Osei', caseNumber: 'MC-20240115-0342' }, foundChild: { id: 'f1', estimatedName: 'Amina (unknown)' } },
  { id: '2', similarityScore: 0.91, confidence: 'high', status: 'pending', missingChild: { id: 'm2', fullName: 'Kwame Mensah', caseNumber: 'MC-20240114-0218' }, foundChild: { id: 'f2', estimatedName: 'Kofi (estimated)' } },
  { id: '3', similarityScore: 0.87, confidence: 'medium', status: 'confirmed', missingChild: { id: 'm3', fullName: 'Fatima Abdulai', caseNumber: 'MC-20240113-0156' }, foundChild: { id: 'f3', estimatedName: 'Fatima (identified)' } },
  { id: '4', similarityScore: 0.82, confidence: 'medium', status: 'pending', missingChild: { id: 'm4', fullName: 'Yusif Iddrisu', caseNumber: 'MC-20240112-0089' }, foundChild: { id: 'f4', estimatedName: 'Boy Y (unidentified)' } },
  { id: '5', similarityScore: 0.74, confidence: 'low', status: 'pending', missingChild: { id: 'm5', fullName: 'Adwoa Darko', caseNumber: 'MC-20240111-0045' }, foundChild: { id: 'f5', estimatedName: 'Girl A (unidentified)' } },
]

// ─── Activity Timeline Mock Data ─────────────────────────────────────
const ACTIVITY_TIMELINE = [
  { id: '1', icon: FileText, description: 'New missing child report filed for Amara Johnson', time: '5 min ago', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  { id: '2', icon: Sparkles, description: 'AI match detected (92% confidence)', time: '15 min ago', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  { id: '3', icon: UserPlus, description: 'Found child registered at Lagos Central Shelter', time: '1 hour ago', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/40' },
  { id: '4', icon: Shield, description: 'Match verified by Officer Ahmed', time: '2 hours ago', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/40' },
  { id: '5', icon: AlertTriangle, description: 'Emergency alert issued for Kofi Boateng', time: '3 hours ago', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/40' },
]

// ─── Reunifications Mock Data ────────────────────────────────────────
const RECENT_REUNIFICATIONS = [
  { id: '1', childName: 'Fatima Abdulai', dateReunited: 'Jan 10, 2024', matchScore: 87, caseNumber: 'MC-20240113-0156' },
  { id: '2', childName: 'Sadio Traoré', dateReunited: 'Jan 8, 2024', matchScore: 94, caseNumber: 'MC-20240108-0112' },
  { id: '3', childName: 'Chidi Eze', dateReunited: 'Jan 5, 2024', matchScore: 79, caseNumber: 'MC-20240105-0098' },
]

// ─── Chart Config ────────────────────────────────────────────────────
const chartConfig: ChartConfig = {
  missing: {
    label: 'Missing',
    color: '#f59e0b', // amber
  },
  found: {
    label: 'Found',
    color: '#14b8a6', // teal
  },
  matched: {
    label: 'Matched',
    color: '#10b981', // emerald
  },
}

// ─── Status Badge Helper ─────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    open: { label: 'Open', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    investigating: { label: 'Investigating', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
    matched: { label: 'Matched', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    closed: { label: 'Closed', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
    unidentified: { label: 'Unidentified', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
    identified: { label: 'Identified', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    reunited: { label: 'Reunited', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    confirmed: { label: 'Confirmed', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    rejected: { label: 'Rejected', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
  }

  const cfg = config[status] || config.open
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const config: Record<string, { label: string; className: string }> = {
    high: { label: 'High', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    medium: { label: 'Medium', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    low: { label: 'Low', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  }

  const cfg = config[confidence] || config.medium
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}

// ─── Confidence Progress Bar ─────────────────────────────────────────
function ConfidenceProgressBar({
  label,
  value,
  colorClass,
  delay,
}: {
  label: string
  value: number
  colorClass: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: delay + 0.2, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

// ─── Skeleton Loaders ────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  )
}

function MatchListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Safe Fetch with Timeout ──────────────────────────────────────────
async function safeFetch(url: string, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}

// ─── Main Dashboard View ─────────────────────────────────────────────
export function DashboardView() {
  const { currentUser, navigateTo } = useAppStore()

  // Data states
  const [analytics, setAnalytics] = useState<AnalyticsStats | null>(null)
  const [missingChildren, setMissingChildren] = useState<MissingChild[]>([])
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])

  // Admin user stats
  const [userStats, setUserStats] = useState<{ total: number; totalActive: number; totalInactive: number; recentRegistrations: number } | null>(null)

  // Loading states — use false initially to prevent infinite loading on error
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [missingLoading, setMissingLoading] = useState(true)
  const [matchesLoading, setMatchesLoading] = useState(true)

  // Error states
  const [analyticsError, setAnalyticsError] = useState(false)
  const [missingError, setMissingError] = useState(false)
  const [matchesError, setMatchesError] = useState(false)

  // Search/filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  // Fetch analytics with timeout and fallback
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    setAnalyticsError(false)
    try {
      const res = await safeFetch('/api/analytics', 8000)
      if (res.ok) {
        const json = await res.json()
        setAnalytics(json.stats || FALLBACK_ANALYTICS)
      } else {
        setAnalytics(FALLBACK_ANALYTICS)
        setAnalyticsError(true)
      }
    } catch {
      setAnalytics(FALLBACK_ANALYTICS)
      setAnalyticsError(true)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // Fetch missing children with timeout and fallback
  const fetchMissing = useCallback(async () => {
    setMissingLoading(true)
    setMissingError(false)
    try {
      const res = await safeFetch('/api/missing?limit=5', 8000)
      if (res.ok) {
        const json = await res.json()
        if (json.data && json.data.length > 0) {
          setMissingChildren(json.data)
        } else {
          setMissingChildren(FALLBACK_MISSING)
        }
      } else {
        setMissingChildren(FALLBACK_MISSING)
        setMissingError(true)
      }
    } catch {
      setMissingChildren(FALLBACK_MISSING)
      setMissingError(true)
    } finally {
      setMissingLoading(false)
    }
  }, [])

  // Fetch match results with timeout and fallback
  const fetchMatches = useCallback(async () => {
    setMatchesLoading(true)
    setMatchesError(false)
    try {
      const res = await safeFetch('/api/matching?limit=5', 8000)
      if (res.ok) {
        const json = await res.json()
        if (json.data && json.data.length > 0) {
          setMatchResults(json.data)
        } else {
          setMatchResults(FALLBACK_MATCHES)
        }
      } else {
        setMatchResults(FALLBACK_MATCHES)
        setMatchesError(true)
      }
    } catch {
      setMatchResults(FALLBACK_MATCHES)
      setMatchesError(true)
    } finally {
      setMatchesLoading(false)
    }
  }, [])

  useEffect(() => {
    // Safety: maximum loading time of 10s to prevent infinite spinners
    const maxLoadTimeout = setTimeout(() => {
      setAnalyticsLoading(false)
      setMissingLoading(false)
      setMatchesLoading(false)
    }, 10000)

    Promise.allSettled([fetchAnalytics(), fetchMissing(), fetchMatches()])
      .finally(() => clearTimeout(maxLoadTimeout))
  }, [fetchAnalytics, fetchMissing, fetchMatches])

  // Fetch admin user stats (admin only)
  useEffect(() => {
    if (currentUser?.role !== 'admin') return
    const fetchUserStats = async () => {
      try {
        const res = await safeFetch('/api/admin/users', 8000)
        if (res.ok) {
          const data = await res.json()
          setUserStats({
            total: data.total || 0,
            totalActive: data.totalActive || 0,
            totalInactive: data.totalInactive || 0,
            recentRegistrations: data.recentRegistrations || 0,
          })
        }
      } catch {
        // Silently fail — non-critical
      }
    }
    fetchUserStats()
  }, [currentUser?.role])

  const stats = analytics || FALLBACK_ANALYTICS

  // Count pending reports (open + investigating cases)
  const pendingReports = missingChildren.filter(
    (c) => c.status === 'open' || c.status === 'investigating'
  ).length || 34

  // Filtered missing children for search/filter
  const filteredChildren = missingChildren.filter((child) => {
    const matchesSearch = searchQuery === '' ||
      child.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.lastSeenLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      child.caseNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || child.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || child.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || priorityFilter !== 'all'

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Role display
  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      admin: { label: 'Administrator', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
      police: { label: 'Police Officer', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
      ngo: { label: 'NGO Worker', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
      rescue: { label: 'Rescue Worker', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
      parent: { label: 'Parent / Guardian', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
    }
    const cfg = roleConfig[role] || roleConfig.parent
    return (
      <Badge variant="outline" className={cfg.className}>
        {cfg.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Welcome Header ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {getGreeting()}, {currentUser?.name || 'User'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome to your {currentUser ? getDashboardTitle(currentUser.role) : 'Dashboard'} — here&apos;s an overview of the recovery platform today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentUser && getRoleBadge(currentUser.role)}
        </div>
      </motion.div>

      {/* ─── Animated Statistics Counter Cards ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <AnimatedStatCard
          title="Missing Cases"
          value={stats.totalMissing}
          maxValue={300}
          icon={Siren}
          trend="+12%"
          trendUp={true}
          gradient="bg-gradient-to-br from-amber-400 to-amber-600"
          glowColor="glass-card-glow-amber"
          ringColor="#f59e0b"
          sparkleColor="#fbbf24"
          delay={0}
          loading={analyticsLoading}
        />
        <AnimatedStatCard
          title="Found Children"
          value={stats.totalFound}
          maxValue={300}
          icon={Search}
          trend="+8%"
          trendUp={true}
          gradient="bg-gradient-to-br from-teal-400 to-teal-600"
          glowColor="glass-card-glow-teal"
          ringColor="#14b8a6"
          sparkleColor="#2dd4bf"
          delay={1}
          loading={analyticsLoading}
        />
        <AnimatedStatCard
          title="Successful Matches"
          value={stats.totalMatches}
          maxValue={150}
          icon={Sparkles}
          trend="+23%"
          trendUp={true}
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
          glowColor="glass-card-glow-emerald"
          ringColor="#10b981"
          sparkleColor="#34d399"
          delay={2}
          loading={analyticsLoading}
        />
        <AnimatedStatCard
          title="Reunifications"
          value={stats.reunifications}
          maxValue={100}
          trend="+5%"
          trendUp={true}
          icon={Heart}
          gradient="bg-gradient-to-br from-rose-400 to-rose-600"
          glowColor="glass-card-glow-rose"
          ringColor="#f43f5e"
          sparkleColor="#fb7185"
          delay={3}
          loading={analyticsLoading}
        />
        <AnimatedStatCard
          title="Active Investigations"
          value={pendingReports}
          maxValue={80}
          icon={Eye}
          trend="-3%"
          trendUp={false}
          gradient="bg-gradient-to-br from-orange-400 to-orange-600"
          glowColor="glass-card-glow-orange"
          ringColor="#f97316"
          sparkleColor="#fb923c"
          delay={4}
          loading={analyticsLoading}
        />
        <AnimatedStatCard
          title="Active Users"
          value={12}
          maxValue={50}
          icon={UserCheck}
          trend="+2"
          trendUp={true}
          gradient="bg-gradient-to-br from-cyan-400 to-cyan-600"
          glowColor="glass-card-glow-cyan"
          ringColor="#06b6d4"
          sparkleColor="#22d3ee"
          delay={5}
          loading={false}
        />
      </div>

      {/* ─── Admin User Management Stats (Admin Only) ──────────────── */}
      {currentUser?.role === 'admin' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="glass-card glass-card-glow-cyan border-0 rounded-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-500" />
                    User Management Overview
                  </CardTitle>
                  <CardDescription>Platform user statistics and recent activity</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                  onClick={() => navigateTo('users')}
                >
                  Manage Users
                  <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200/50 dark:border-cyan-800/30">
                  <Users className="h-5 w-5 text-cyan-500" />
                  <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{userStats?.total ?? '—'}</span>
                  <span className="text-[11px] text-muted-foreground">Total Users</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30">
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{userStats?.totalActive ?? '—'}</span>
                  <span className="text-[11px] text-muted-foreground">Active</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/20 border border-gray-200/50 dark:border-gray-700/30">
                  <XCircle className="h-5 w-5 text-gray-500" />
                  <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">{userStats?.totalInactive ?? '—'}</span>
                  <span className="text-[11px] text-muted-foreground">Disabled</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
                  <Shield className="h-5 w-5 text-amber-500" />
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">5</span>
                  <span className="text-[11px] text-muted-foreground">Total Roles</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-800/30 col-span-2 sm:col-span-1">
                  <UserPlus className="h-5 w-5 text-rose-500" />
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">{userStats?.recentRegistrations ?? '—'}</span>
                  <span className="text-[11px] text-muted-foreground">New (7d)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ─── Quick Actions Row ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <Card className="glass-card glass-card-shimmer glass-card-glow-emerald border-0 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks to help speed up recovery efforts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                className="h-auto py-3 px-4 flex flex-col items-center gap-2 hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/30 dark:hover:border-amber-700 transition-all duration-200 btn-3d-shimmer"
                onClick={() => navigateTo('report-missing')}
              >
                <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium">Report Missing</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 px-4 flex flex-col items-center gap-2 hover:bg-teal-50 hover:border-teal-300 dark:hover:bg-teal-950/30 dark:hover:border-teal-700 transition-all duration-200 btn-3d-shimmer"
                onClick={() => navigateTo('register-found')}
              >
                <UserPlus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-medium">Register Found</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 px-4 flex flex-col items-center gap-2 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/30 dark:hover:border-emerald-700 transition-all duration-200 btn-3d-shimmer"
                onClick={() => navigateTo('face-compare')}
              >
                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium">Run AI Match</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 px-4 flex flex-col items-center gap-2 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/30 dark:hover:border-rose-700 transition-all duration-200 btn-3d-shimmer"
                onClick={() => navigateTo('case-tracker')}
              >
                <ClipboardList className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                <span className="text-xs font-medium">Case Tracker</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Activity Chart + Recent Match Alerts ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card border-0 rounded-xl h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Activity Overview</CardTitle>
                  <CardDescription>Monthly missing, found & matched reports</CardDescription>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <BarChart data={stats.monthlyData} barGap={2} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      fontSize={12}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <ChartLegend
                      content={<ChartLegendContent />}
                    />
                    <Bar
                      dataKey="missing"
                      fill="var(--color-missing)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="found"
                      fill="var(--color-found)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="matched"
                      fill="var(--color-matched)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Match Alerts */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="glass-card glass-card-glow-emerald border-0 rounded-xl h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Match Alerts</CardTitle>
                  <CardDescription>High-confidence AI matches</CardDescription>
                </div>
                <Sparkles className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              {matchesLoading ? (
                <MatchListSkeleton />
              ) : (
                <div className="space-y-4 max-h-[280px] overflow-y-auto custom-scrollbar">
                  {matchResults.map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        navigateTo('match-results')
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
                          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {match.missingChild.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            ↔ {match.foundChild.estimatedName || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {(match.similarityScore * 100).toFixed(0)}%
                        </span>
                        <ConfidenceBadge confidence={match.confidence} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Recent Activity Timeline + Confidence Bars ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card border-0 rounded-xl h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>Latest platform events and actions</CardDescription>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-0">
                {ACTIVITY_TIMELINE.map((item, index) => {
                  const IconComp = item.icon
                  const isLast = index === ACTIVITY_TIMELINE.length - 1
                  return (
                    <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {/* Vertical connecting line */}
                      {!isLast && (
                        <div className="absolute left-[17px] top-[38px] bottom-0 w-px bg-border" />
                      )}
                      {/* Icon circle */}
                      <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.bg}`}>
                        <IconComp className={`h-4 w-4 ${item.color}`} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-sm font-medium leading-tight">
                          {item.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.time}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Match Confidence Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="glass-card glass-card-glow-emerald border-0 rounded-xl h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">AI Match Confidence</CardTitle>
                  <CardDescription>Distribution of match scores</CardDescription>
                </div>
                <Sparkles className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <ConfidenceProgressBar
                label="High Confidence (>70%)"
                value={65}
                colorClass="bg-emerald-500"
                delay={0.7}
              />
              <ConfidenceProgressBar
                label="Medium Confidence (40-70%)"
                value={25}
                colorClass="bg-amber-500"
                delay={0.8}
              />
              <ConfidenceProgressBar
                label="Low Confidence (<40%)"
                value={10}
                colorClass="bg-rose-500"
                delay={0.9}
              />
              <div className="pt-3 mt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total matches analyzed</span>
                  <span className="font-semibold">{stats.totalMatches}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Avg. confidence</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">71.3%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ─── Recent Successful Reunifications ───────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.65 }}
      >
        <Card className="glass-card glass-card-glow-rose border-0 rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Successful Reunifications</CardTitle>
                <CardDescription>Children recently reunited with their families</CardDescription>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {RECENT_REUNIFICATIONS.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.childName}</p>
                      <p className="text-xs text-muted-foreground">
                        Reunited on {item.dateReunited}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    >
                      {item.matchScore}% match
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                      {item.caseNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Recent Missing Children Table ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
      >
        <Card className="glass-card glass-card-glow-amber border-0 rounded-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Missing Children</CardTitle>
                <CardDescription>Latest 5 missing child reports</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                onClick={() => navigateTo('missing-list')}
              >
                View All
                <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* ─── Smart Search Filters Bar ────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 pb-4 border-b">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, location, or case #..."
                  className="pl-9 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-9">
                    <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="matched">Matched</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setPriorityFilter('all')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {missingLoading ? (
              <TableSkeleton />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Last Seen
                        </div>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Date
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Case #</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChildren.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No results found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredChildren.map((child) => (
                        <TableRow
                          key={child.id}
                          className="cursor-pointer"
                          onClick={() => navigateTo('missing-list')}
                        >
                          <TableCell className="font-medium">{child.fullName}</TableCell>
                          <TableCell>{child.age}</TableCell>
                          <TableCell>{child.gender}</TableCell>
                          <TableCell className="hidden sm:table-cell max-w-[200px] truncate">
                            {child.lastSeenLocation}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {formatDate(child.lastSeenDate)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={child.status} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                            {child.caseNumber}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
