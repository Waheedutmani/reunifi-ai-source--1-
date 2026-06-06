'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Scan,
  Shield,
  Sparkles,
  CheckCircle2,
  Search,
  Clock,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/store/app-store'

// ─── Types ───────────────────────────────────────────────────────────
interface MatchStatus {
  id: string
  missingChildName: string
  confidenceScore: number
  progress: number
  status: 'scanning' | 'potential_match' | 'verified' | 'reunited'
  lastUpdated: string
  matchesScanned: number
  totalScans: number
}

// ─── Mock Data ───────────────────────────────────────────────────────
const MOCK_MATCHES: MatchStatus[] = [
  {
    id: '1',
    missingChildName: 'Kwame Boateng',
    confidenceScore: 87,
    progress: 72,
    status: 'potential_match',
    lastUpdated: '15 min ago',
    matchesScanned: 144,
    totalScans: 200,
  },
  {
    id: '2',
    missingChildName: 'Ama Darko',
    confidenceScore: 94,
    progress: 100,
    status: 'verified',
    lastUpdated: '2 hours ago',
    matchesScanned: 200,
    totalScans: 200,
  },
]

// ─── Status Config ───────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  scanning: {
    label: 'Scanning',
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    icon: Clock,
  },
  potential_match: {
    label: 'Potential Match',
    className: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
    icon: Search,
  },
  verified: {
    label: 'Verified',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  reunited: {
    label: 'Reunited',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: Sparkles,
  },
}

// ─── View ────────────────────────────────────────────────────────────
export function MatchStatusView() {
  const { currentUser } = useAppStore()

  // Parent-only guard
  if (currentUser?.role !== 'parent' && currentUser?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold text-muted-foreground">Access Denied</h3>
          <p className="mt-1 text-sm text-muted-foreground/70">Parent access required</p>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
            <Scan className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-foreground">Match Status</h1>
            <p className="text-sm text-muted-foreground">Track AI matching progress for your reported children</p>
          </div>
        </div>
      </motion.div>

      {/* Match Status Cards */}
      <div className="space-y-4">
        {MOCK_MATCHES.map((match, idx) => {
          const sCfg = statusConfig[match.status]
          const StatusIcon = sCfg.icon

          // Progress bar color based on status
          const progressColor =
            match.status === 'reunited'
              ? '[&>div]:bg-emerald-500'
              : match.status === 'verified'
              ? '[&>div]:bg-emerald-500'
              : match.status === 'potential_match'
              ? '[&>div]:bg-cyan-500'
              : '[&>div]:bg-amber-500'

          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.12 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        match.status === 'reunited'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40'
                          : match.status === 'verified'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40'
                          : match.status === 'potential_match'
                          ? 'bg-cyan-100 dark:bg-cyan-900/40'
                          : 'bg-amber-100 dark:bg-amber-900/40'
                      }`}>
                        <StatusIcon className={`h-5 w-5 ${
                          match.status === 'reunited'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : match.status === 'verified'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : match.status === 'potential_match'
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{match.missingChildName}</CardTitle>
                        <CardDescription>Updated {match.lastUpdated}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className={`text-lg font-bold ${
                          match.confidenceScore >= 90
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : match.confidenceScore >= 70
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {match.confidenceScore}%
                        </p>
                      </div>
                      <Badge variant="outline" className={sCfg.className}>
                        {sCfg.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Scan Progress</span>
                      <span className="font-medium">
                        {match.matchesScanned} / {match.totalScans} scans
                      </span>
                    </div>
                    <Progress value={match.progress} className={`h-3 ${progressColor}`} />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{match.progress}% complete</span>
                      {match.status === 'scanning' && (
                        <span className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Scanning in progress...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Steps */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(['scanning', 'potential_match', 'verified', 'reunited'] as const).map((step, stepIdx) => {
                        const stepCfg = statusConfig[step]
                        const currentStepIdx = ['scanning', 'potential_match', 'verified', 'reunited'].indexOf(match.status)
                        const isActive = stepIdx <= currentStepIdx
                        const isCurrent = step === match.status

                        return (
                          <div key={step} className="flex items-center gap-1.5">
                            <div className={`flex items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                              <div className={`h-2 w-2 rounded-full ${
                                isCurrent
                                  ? match.status === 'reunited'
                                    ? 'bg-emerald-500'
                                    : match.status === 'verified'
                                    ? 'bg-emerald-500'
                                    : match.status === 'potential_match'
                                    ? 'bg-cyan-500'
                                    : 'bg-amber-500'
                                  : isActive
                                  ? 'bg-emerald-500'
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`} />
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {stepCfg.label}
                              </span>
                            </div>
                            {stepIdx < 3 && (
                              <div className={`h-px w-2 sm:w-4 ${stepIdx < currentStepIdx ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
