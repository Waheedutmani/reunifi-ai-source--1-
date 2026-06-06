'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  Search as SearchIcon,
  UserCheck,
  Heart,
  Shield,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'

// ─── Types ───────────────────────────────────────────────────────────
interface Report {
  id: string
  childName: string
  age: number
  status: 'submitted' | 'under_review' | 'match_found' | 'reunited'
  dateReported: string
  lastSeenLocation: string
}

// ─── Mock Data ───────────────────────────────────────────────────────
const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    childName: 'Kwame Boateng',
    age: 8,
    status: 'under_review',
    dateReported: 'Jan 15, 2024',
    lastSeenLocation: 'Accra Central Market',
  },
  {
    id: '2',
    childName: 'Ama Darko',
    age: 5,
    status: 'match_found',
    dateReported: 'Jan 10, 2024',
    lastSeenLocation: 'Kumasi Shopping Mall',
  },
  {
    id: '3',
    childName: 'Kofi Asante',
    age: 10,
    status: 'reunited',
    dateReported: 'Dec 28, 2023',
    lastSeenLocation: 'Tema Harbor District',
  },
]

// ─── Status Config ───────────────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  submitted: {
    label: 'Submitted',
    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700',
    icon: FileText,
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
    icon: Clock,
  },
  match_found: {
    label: 'Match Found',
    className: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
    icon: SearchIcon,
  },
  reunited: {
    label: 'Reunited',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: Heart,
  },
}

// ─── View ────────────────────────────────────────────────────────────
export function MyReportsView() {
  const { currentUser, navigateTo } = useAppStore()

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">My Reports</h1>
              <p className="text-sm text-muted-foreground">Track your reported missing children</p>
            </div>
          </div>
          <Button
            onClick={() => navigateTo('report-missing')}
            className="min-h-[44px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Report New Missing Child
          </Button>
        </div>
      </motion.div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Submitted', count: MOCK_REPORTS.filter((r) => r.status === 'submitted').length, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800/40' },
          { label: 'Under Review', count: MOCK_REPORTS.filter((r) => r.status === 'under_review').length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
          { label: 'Match Found', count: MOCK_REPORTS.filter((r) => r.status === 'match_found').length, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
          { label: 'Reunited', count: MOCK_REPORTS.filter((r) => r.status === 'reunited').length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${item.bg} mb-2`}>
                  <span className={`text-sm font-bold ${item.color}`}>{item.count}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Report Cards */}
      <div className="space-y-4">
        {MOCK_REPORTS.map((report, idx) => {
          const sCfg = statusConfig[report.status]
          const StatusIcon = sCfg.icon

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + idx * 0.08 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Report Info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        report.status === 'reunited'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40'
                          : report.status === 'match_found'
                          ? 'bg-cyan-100 dark:bg-cyan-900/40'
                          : report.status === 'under_review'
                          ? 'bg-amber-100 dark:bg-amber-900/40'
                          : 'bg-gray-100 dark:bg-gray-800/40'
                      }`}>
                        <StatusIcon className={`h-5 w-5 ${
                          report.status === 'reunited'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : report.status === 'match_found'
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : report.status === 'under_review'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{report.childName}</h3>
                          <span className="text-sm text-muted-foreground">Age {report.age}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last seen: {report.lastSeenLocation}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Reported: {report.dateReported}
                        </p>
                      </div>
                    </div>

                    {/* Right: Status */}
                    <div className="shrink-0">
                      <Badge variant="outline" className={sCfg.className}>
                        {sCfg.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      {(['submitted', 'under_review', 'match_found', 'reunited'] as const).map((step, stepIdx) => {
                        const stepCfg = statusConfig[step]
                        const currentStepIdx = ['submitted', 'under_review', 'match_found', 'reunited'].indexOf(report.status)
                        const isActive = stepIdx <= currentStepIdx
                        const isCurrent = step === report.status

                        return (
                          <div key={step} className="flex items-center gap-1.5">
                            <div className={`flex items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-30'}`}>
                              <div className={`h-2 w-2 rounded-full ${
                                isCurrent
                                  ? report.status === 'reunited'
                                    ? 'bg-emerald-500'
                                    : report.status === 'match_found'
                                    ? 'bg-cyan-500'
                                    : report.status === 'under_review'
                                    ? 'bg-amber-500'
                                    : 'bg-gray-500'
                                  : isActive
                                  ? 'bg-emerald-500'
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`} />
                              <span className="text-[10px] font-medium text-muted-foreground hidden sm:inline">
                                {stepCfg.label}
                              </span>
                            </div>
                            {stepIdx < 3 && (
                              <div className={`h-px w-3 sm:w-6 ${stepIdx < currentStepIdx ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
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
