'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  ScanFace, CheckCircle2, XCircle, Eye, Clock, Shield, Brain,
  ArrowRightLeft, Loader2, BarChart3, AlertTriangle, Filter,
  Cpu, Network, GitCompare, UserCheck, TrendingUp, Users,
  MapPin, Calendar, Heart, Fingerprint, Activity,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useAppStore } from '@/store/app-store'
import { MatchResultCard, MatchCardSkeleton } from '@/components/match/match-result-card'

interface MatchData {
  id: string
  missingChildId: string
  foundChildId: string
  similarityScore: number
  confidence: string
  verified: boolean
  status: string
  createdAt: string
  updatedAt: string
  missingChild: {
    id: string
    fullName: string
    age: number
    gender: string
    photos: string
    lastSeenLocation: string
    caseNumber: string
    status: string
  }
  foundChild: {
    id: string
    estimatedName: string | null
    estimatedAge: number
    gender: string
    photos: string
    foundLocation: string
    healthStatus: string
    status: string
  }
  verifier?: {
    id: string
    name: string
    email: string
  } | null
}

const PIPELINE_STEPS = [
  { icon: ScanFace, label: 'Face Detection', desc: 'Locate facial landmarks' },
  { icon: Cpu, label: 'Embedding Extraction', desc: 'Generate 128D vectors' },
  { icon: Network, label: 'Siamese Network', desc: 'Compare embeddings' },
  { icon: GitCompare, label: 'Similarity Score', desc: 'Calculate distance' },
  { icon: UserCheck, label: 'Human Verification', desc: 'Expert review' },
]

const CONFIDENCE_CONFIG = {
  low: { color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800', label: 'Low Confidence', ringColor: '#f43f5e' },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800', label: 'Medium Confidence', ringColor: '#f59e0b' },
  high: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800', label: 'High Confidence', ringColor: '#10b981' },
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800', label: 'Pending' },
  confirmed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800', label: 'Confirmed' },
  rejected: { color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700', label: 'Rejected' },
}

// ─── Detail Dialog Confidence Ring ───────────────────────────────────────

function DetailConfidenceRing({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="oklch(0.8 0.02 155 / 30%)" strokeWidth="8" strokeDasharray={`${circumference / 60 - 2} 2`} strokeLinecap="round" />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        {/* Outer glow */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius + 5} fill="none"
          stroke={color} strokeWidth="1.5" strokeLinecap="round"
          strokeDasharray={circumference * 1.06}
          initial={{ strokeDashoffset: circumference * 1.06 }}
          animate={{ strokeDashoffset: offset * 1.06 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          opacity={0.3}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}%
        </motion.span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">similarity</span>
      </div>
    </div>
  )
}

export function MatchResultsView() {
  const { selectedMatchId, setSelectedMatchId } = useAppStore()
  const [matches, setMatches] = useState<MatchData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchMatches = useCallback(async (status?: string) => {
    setLoading(true)
    try {
      const url = status && status !== 'all'
        ? `/api/matching?status=${status}`
        : '/api/matching'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setMatches(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch matches:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatches(activeTab === 'all' ? undefined : activeTab)
  }, [activeTab, fetchMatches])

  const handleVerify = async (matchId: string, status: 'confirmed' | 'rejected') => {
    setActionLoading(matchId)
    try {
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('reunifi_token') : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`

      const res = await fetch(`/api/matching?id=${matchId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        fetchMatches(activeTab === 'all' ? undefined : activeTab)
      } else {
        const data = await res.json().catch(() => ({}))
        console.error('Failed to update match:', data.error || res.statusText)
      }
    } catch (err) {
      console.error('Failed to update match:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const stats = {
    total: matches.length,
    pending: matches.filter(m => m.status === 'pending').length,
    confirmed: matches.filter(m => m.status === 'confirmed').length,
    rejected: matches.filter(m => m.status === 'rejected').length,
  }

  const confidenceData = [
    { name: 'High', value: matches.filter(m => m.confidence === 'high').length, color: '#10b981' },
    { name: 'Medium', value: matches.filter(m => m.confidence === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: matches.filter(m => m.confidence === 'low').length, color: '#f43f5e' },
  ].filter(d => d.value > 0)

  const viewDetails = (match: MatchData) => {
    setSelectedMatch(match)
    setSelectedMatchId(match.id)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-emerald-600" />
            AI Facial Recognition Match Results
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered facial matching with human verification workflow
          </p>
        </div>
      </div>

      {/* AI Pipeline Visualization */}
      <Card className="glass-card glass-card-shimmer glass-card-glow-emerald border-0 rounded-xl bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between overflow-x-auto gap-1 pb-1">
            {PIPELINE_STEPS.map((step, idx) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center text-center min-w-[80px]">
                  <motion.div
                    className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.15 }}
                  >
                    <step.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </motion.div>
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-tight">{step.label}</span>
                  <span className="text-[9px] text-emerald-500 dark:text-emerald-500">{step.desc}</span>
                </div>
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="w-4 h-0.5 bg-emerald-300 dark:bg-emerald-700 mx-1 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Matches', value: stats.total, icon: BarChart3, color: 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40' },
          { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' },
          { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-stat glass-card-shimmer glass-card-glow-emerald border-0 rounded-xl">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${stat.color} flex items-center justify-center shrink-0`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Confidence Distribution Chart */}
      {confidenceData.length > 0 && (
        <Card className="glass-card border-0 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Match Confidence Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={confidenceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={50}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {confidenceData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {confidenceData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs sm:text-sm">{d.name} Confidence</span>
                  <span className="text-xs sm:text-sm font-semibold">({d.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all" className="gap-1">
            <Filter className="h-3.5 w-3.5" /> All
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1">
            <Clock className="h-3.5 w-3.5" /> Pending
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1">
            <XCircle className="h-3.5 w-3.5" /> Rejected
          </TabsTrigger>
        </TabsList>

        {['all', 'pending', 'confirmed', 'rejected'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <MatchCardSkeleton key={i} />
                ))}
              </div>
            ) : matches.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <ScanFace className="h-12 w-12 mx-auto text-muted-foreground/40" />
                  <h3 className="mt-4 text-lg font-semibold text-muted-foreground">No Match Results</h3>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    {tab === 'all'
                      ? 'No AI matches have been generated yet. Run facial recognition to find potential matches.'
                      : `No ${tab} matches found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                  {matches.map((match, idx) => (
                    <MatchResultCard
                      key={match.id}
                      match={match}
                      index={idx}
                      onVerify={handleVerify}
                      onViewDetails={viewDetails}
                      actionLoading={actionLoading}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail Dialog — Enhanced */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanFace className="h-5 w-5 text-emerald-600" />
              Match Detail — Full Analysis
            </DialogTitle>
            <DialogDescription>
              Detailed AI facial recognition match analysis
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-5">
              {/* Side-by-side with ring */}
              <div className="flex items-center gap-4">
                {/* Missing child */}
                <div className="text-center flex-1">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center overflow-hidden mx-auto border-2 border-amber-200 dark:border-amber-700 relative">
                    {(() => {
                      const photos: string[] = (() => { try { return JSON.parse(selectedMatch.missingChild.photos || '[]') } catch { return [] } })()
                      return photos[0] ? (
                        <img src={photos[0]} alt={selectedMatch.missingChild.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="h-7 w-7 text-amber-500" />
                      )
                    })()}
                  </div>
                  <p className="mt-2 text-sm font-semibold">{selectedMatch.missingChild.fullName}</p>
                  <p className="text-xs text-muted-foreground">Missing • Case #{selectedMatch.missingChild.caseNumber}</p>
                </div>

                {/* Center: Confidence Ring */}
                <div className="flex flex-col items-center px-2">
                  <DetailConfidenceRing score={selectedMatch.similarityScore} size={120} />
                  <Badge className={`mt-2 ${CONFIDENCE_CONFIG[selectedMatch.confidence as keyof typeof CONFIDENCE_CONFIG]?.color || CONFIDENCE_CONFIG.medium.color} border text-[10px]`}>
                    {selectedMatch.confidence} confidence
                  </Badge>
                </div>

                {/* Found child */}
                <div className="text-center flex-1">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-200 to-teal-300 flex items-center justify-center overflow-hidden mx-auto border-2 border-emerald-200 dark:border-emerald-700 relative">
                    {(() => {
                      const photos: string[] = (() => { try { return JSON.parse(selectedMatch.foundChild.photos || '[]') } catch { return [] } })()
                      return photos[0] ? (
                        <img src={photos[0]} alt="Found child" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="h-7 w-7 text-emerald-500" />
                      )
                    })()}
                  </div>
                  <p className="mt-2 text-sm font-semibold">{selectedMatch.foundChild.estimatedName || 'Unidentified'}</p>
                  <p className="text-xs text-muted-foreground">Found • {selectedMatch.foundChild.healthStatus}</p>
                </div>
              </div>

              <Separator />

              {/* Comparison Table */}
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <GitCompare className="h-4 w-4 text-cyan-500" />
                  Side-by-Side Comparison
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="font-medium text-muted-foreground text-center">Field</div>
                  <div className="font-medium text-muted-foreground text-center">Missing Child</div>
                  <div className="font-medium text-muted-foreground text-center">Found Child</div>

                  <div className="text-muted-foreground">Age</div>
                  <div className="text-center">{selectedMatch.missingChild.age}</div>
                  <div className="text-center">~{selectedMatch.foundChild.estimatedAge}</div>

                  <div className="text-muted-foreground">Gender</div>
                  <div className="text-center">{selectedMatch.missingChild.gender}</div>
                  <div className="text-center">{selectedMatch.foundChild.gender}</div>

                  <div className="text-muted-foreground">Location</div>
                  <div className="text-center truncate">{selectedMatch.missingChild.lastSeenLocation}</div>
                  <div className="text-center truncate">{selectedMatch.foundChild.foundLocation}</div>

                  <div className="text-muted-foreground">Status</div>
                  <div className="text-center"><Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">{selectedMatch.missingChild.status}</Badge></div>
                  <div className="text-center"><Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">{selectedMatch.foundChild.status}</Badge></div>
                </div>
              </div>

              <Separator />

              {/* Match Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Missing From</p>
                  <p className="font-medium">{selectedMatch.missingChild.lastSeenLocation}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Found At</p>
                  <p className="font-medium">{selectedMatch.foundChild.foundLocation}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Match Status</p>
                  <Badge variant="outline" className={`${STATUS_CONFIG[selectedMatch.status]?.color || ''} border text-xs`}>
                    {selectedMatch.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Match Date</p>
                  <p className="font-medium">{new Date(selectedMatch.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedMatch.verified && selectedMatch.verifier && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-sm">
                  <p className="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified by {selectedMatch.verifier.name}
                  </p>
                </div>
              )}

              <Separator />

              {/* Feature Breakdown */}
              <div className="space-y-3">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-emerald-500" />
                  AI Feature Analysis
                </p>
                {[
                  { label: 'Facial Structure', value: Math.min(selectedMatch.similarityScore + 5, 99) },
                  { label: 'Eye Region', value: Math.min(selectedMatch.similarityScore + Math.random() * 10, 99) },
                  { label: 'Nose Region', value: Math.min(selectedMatch.similarityScore - 2, 99) },
                  { label: 'Mouth Region', value: Math.min(selectedMatch.similarityScore - Math.random() * 8, 99) },
                ].map((feature) => (
                  <div key={feature.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{feature.label}</span>
                      <span className="font-medium">{Math.round(feature.value)}%</span>
                    </div>
                    <Progress value={feature.value} className="h-1.5" />
                  </div>
                ))}
              </div>

              <Separator />

              {/* AI Pipeline Stages */}
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-cyan-500" />
                  Processing Pipeline
                </p>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { icon: ScanFace, label: 'Detect', done: true },
                    { icon: Cpu, label: 'Embed', done: true },
                    { icon: Network, label: 'Compare', done: true },
                    { icon: GitCompare, label: 'Score', done: true },
                    { icon: UserCheck, label: 'Verify', done: selectedMatch.status !== 'pending' },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-1">
                      <div className={`flex items-center gap-1 rounded-md px-2 py-1 ${
                        step.done
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                      }`}>
                        <step.icon className={`h-3 w-3 ${step.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
                        <span className={`text-[10px] font-medium ${step.done ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                          {step.label}
                        </span>
                        {step.done && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />}
                      </div>
                      {i < 4 && <span className="text-muted-foreground/30">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
