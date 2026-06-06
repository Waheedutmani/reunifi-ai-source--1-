'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  Shield,
  FileSearch,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/store/app-store'

// ─── Types ───────────────────────────────────────────────────────────
interface Investigation {
  id: string
  caseNumber: string
  childName: string
  status: 'open' | 'in_progress' | 'closed'
  priority: 'critical' | 'high' | 'normal'
  assignedOfficer: string
  lastUpdated: string
  location: string
}

// ─── Mock Data ───────────────────────────────────────────────────────
const MOCK_INVESTIGATIONS: Investigation[] = [
  {
    id: '1',
    caseNumber: 'INV-2024-0042',
    childName: 'Amina Osei',
    status: 'in_progress',
    priority: 'critical',
    assignedOfficer: 'Officer Mensah',
    lastUpdated: '2 hours ago',
    location: 'Accra Central Market',
  },
  {
    id: '2',
    caseNumber: 'INV-2024-0039',
    childName: 'Kwame Mensah',
    status: 'open',
    priority: 'high',
    assignedOfficer: 'Officer Boateng',
    lastUpdated: '6 hours ago',
    location: 'Kumasi Railway Station',
  },
  {
    id: '3',
    caseNumber: 'INV-2024-0035',
    childName: 'Fatima Abdulai',
    status: 'closed',
    priority: 'normal',
    assignedOfficer: 'Officer Ahmed',
    lastUpdated: '2 days ago',
    location: 'Tamale Bus Terminal',
  },
  {
    id: '4',
    caseNumber: 'INV-2024-0031',
    childName: 'Yusif Iddrisu',
    status: 'in_progress',
    priority: 'high',
    assignedOfficer: 'Officer Mensah',
    lastUpdated: '1 day ago',
    location: 'Cape Coast Castle Area',
  },
]

// ─── Status/Priority Config ──────────────────────────────────────────
const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  open: { label: 'Open', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800', icon: AlertCircle },
  in_progress: { label: 'In Progress', className: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800', icon: Clock },
  closed: { label: 'Closed', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300' },
  high: { label: 'High', className: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300' },
  normal: { label: 'Normal', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400' },
}

// ─── View ────────────────────────────────────────────────────────────
export function InvestigationView() {
  const { currentUser } = useAppStore()
  const [statusFilter, setStatusFilter] = useState('all')

  // Police-only guard
  if (currentUser?.role !== 'police' && currentUser?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold text-muted-foreground">Access Denied</h3>
          <p className="mt-1 text-sm text-muted-foreground/70">Police or admin access required</p>
        </CardContent>
      </Card>
    )
  }

  const filteredInvestigations = MOCK_INVESTIGATIONS.filter(
    (inv) => statusFilter === 'all' || inv.status === statusFilter
  )

  const openCount = MOCK_INVESTIGATIONS.filter((i) => i.status === 'open').length
  const inProgressCount = MOCK_INVESTIGATIONS.filter((i) => i.status === 'in_progress').length
  const closedCount = MOCK_INVESTIGATIONS.filter((i) => i.status === 'closed').length

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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
              <FileSearch className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Investigations</h1>
              <p className="text-sm text-muted-foreground">Manage and track active investigations</p>
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Open', count: openCount, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
          { label: 'In Progress', count: inProgressCount, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
          { label: 'Closed', count: closedCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bg}`}>
                  <span className={`text-lg font-bold ${item.color}`}>{item.count}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label} Investigations</p>
                  <p className="text-xs text-muted-foreground">Currently tracked</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Investigation Cards */}
      <div className="space-y-4">
        {filteredInvestigations.map((inv, idx) => {
          const sCfg = statusConfig[inv.status]
          const pCfg = priorityConfig[inv.priority]
          const StatusIcon = sCfg.icon

          return (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + idx * 0.08 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Case Info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/40">
                        <StatusIcon className={`h-5 w-5 ${inv.status === 'open' ? 'text-amber-600 dark:text-amber-400' : inv.status === 'in_progress' ? 'text-cyan-600 dark:text-cyan-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{inv.childName}</h3>
                          <Badge variant="outline" className={pCfg.className}>{pCfg.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          <span className="font-mono text-xs">{inv.caseNumber}</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="hidden sm:inline">{inv.location}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{inv.assignedOfficer}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{inv.lastUpdated}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status & Action */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className={sCfg.className}>
                        {sCfg.label}
                      </Badge>
                      <Button size="sm" variant="ghost" className="h-8 w-8 min-h-[44px] min-w-[44px] p-0">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}

        {filteredInvestigations.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold text-muted-foreground">No Investigations Found</h3>
              <p className="mt-1 text-sm text-muted-foreground/70">No cases match the selected filter</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
