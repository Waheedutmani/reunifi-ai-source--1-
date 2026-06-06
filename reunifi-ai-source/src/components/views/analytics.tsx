'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  MapPin,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useAppStore } from '@/store/app-store'

// ─── Types ───────────────────────────────────────────────────────────
interface StatItem {
  title: string
  value: number
  trend: string
  trendUp: boolean
  icon: React.ElementType
  color: string
}

interface MonthlyData {
  month: string
  cases: number
  matches: number
}

interface LocationData {
  location: string
  count: number
}

interface AIMatchActivity {
  id: string
  childName: string
  confidence: number
  time: string
  status: string
}

// ─── Mock Data ───────────────────────────────────────────────────────
const STATS: StatItem[] = [
  { title: 'Total Cases', value: 247, trend: '+12%', trendUp: true, icon: Users, color: 'text-amber-600 dark:text-amber-400' },
  { title: 'Match Rate', value: 72, trend: '+8%', trendUp: true, icon: Sparkles, color: 'text-emerald-600 dark:text-emerald-400' },
  { title: 'Avg Response Time', value: 4, trend: '-15%', trendUp: true, icon: Clock, color: 'text-teal-600 dark:text-teal-400' },
  { title: 'Active Alerts', value: 14, trend: '+3', trendUp: false, icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400' },
]

const MONTHLY_DATA: MonthlyData[] = [
  { month: 'Jul', cases: 32, matches: 18 },
  { month: 'Aug', cases: 28, matches: 22 },
  { month: 'Sep', cases: 35, matches: 19 },
  { month: 'Oct', cases: 24, matches: 25 },
  { month: 'Nov', cases: 40, matches: 28 },
  { month: 'Dec', cases: 31, matches: 20 },
]

const LOCATION_DATA: LocationData[] = [
  { location: 'Accra', count: 45 },
  { location: 'Kumasi', count: 32 },
  { location: 'Tamale', count: 28 },
  { location: 'Cape Coast', count: 19 },
  { location: 'Tema', count: 15 },
]

const AI_MATCH_ACTIVITY: AIMatchActivity[] = [
  { id: '1', childName: 'Amina Osei', confidence: 96, time: '5 min ago', status: 'verified' },
  { id: '2', childName: 'Kwame Mensah', confidence: 89, time: '22 min ago', status: 'pending' },
  { id: '3', childName: 'Fatima Abdulai', confidence: 82, time: '1 hour ago', status: 'verified' },
  { id: '4', childName: 'Yusif Iddrisu', confidence: 74, time: '3 hours ago', status: 'scanning' },
  { id: '5', childName: 'Adwoa Darko', confidence: 67, time: '5 hours ago', status: 'pending' },
]

// ─── Chart Config ────────────────────────────────────────────────────
const trendChartConfig: ChartConfig = {
  cases: {
    label: 'Cases',
    color: '#f59e0b',
  },
  matches: {
    label: 'Matches',
    color: '#10b981',
  },
}

const locationChartConfig: ChartConfig = {
  count: {
    label: 'Cases',
    color: '#14b8a6',
  },
}

// ─── Activity Status Badge ───────────────────────────────────────────
function ActivityStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800' },
    scanning: { label: 'Scanning', className: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800' },
  }
  const cfg = config[status] || config.pending
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
}

// ─── View ────────────────────────────────────────────────────────────
export function AnalyticsView() {
  const { currentUser } = useAppStore()

  // Admin-only guard
  if (currentUser?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold text-muted-foreground">Access Denied</h3>
          <p className="mt-1 text-sm text-muted-foreground/70">Admin access required</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/30">
            <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">Platform performance metrics and AI matching insights</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat, idx) => {
          const IconComp = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription className="text-sm font-medium">{stat.title}</CardDescription>
                  <IconComp className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold tracking-tight">
                    {stat.title === 'Match Rate' ? `${stat.value}%` : stat.title === 'Avg Response Time' ? `${stat.value}h` : stat.value.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.trendUp ? (
                      <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-rose-500" />
                    )}
                    <span className={`text-xs font-medium ${stat.trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {stat.trend}
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Monthly Trends</CardTitle>
                  <CardDescription>Cases reported vs matches found</CardDescription>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={trendChartConfig} className="h-[280px] w-full">
                <BarChart data={MONTHLY_DATA} barGap={4} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="cases" fill="var(--color-cases)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="matches" fill="var(--color-matches)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Locations Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Top Locations</CardTitle>
                  <CardDescription>Cases by geographic region</CardDescription>
                </div>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={locationChartConfig} className="h-[280px] w-full">
                <BarChart data={LOCATION_DATA} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                  <YAxis type="category" dataKey="location" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} maxBarSize={24} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent AI Match Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent AI Match Activity</CardTitle>
                <CardDescription>Latest automated matching results</CardDescription>
              </div>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {AI_MATCH_ACTIVITY.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  className="flex items-center justify-between gap-2 sm:gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                      <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.childName}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {item.confidence}%
                    </span>
                    <ActivityStatusBadge status={item.status} />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
