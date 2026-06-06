'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2, XCircle, Eye, Clock, Shield, Brain,
  ArrowRightLeft, Loader2, AlertTriangle, Users,
  ChevronDown, ChevronUp, ScanFace, Cpu, Network,
  GitCompare, UserCheck, MapPin, Calendar, Heart,
  Fingerprint, Activity,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────

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

// ─── Config Maps ─────────────────────────────────────────────────────────

const CONFIDENCE_CONFIG = {
  low: { color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800', label: 'Low Confidence', icon: AlertTriangle, ringColor: '#f43f5e', ringGlow: 'match-ring-glow-rose', accent: 'match-card-accent-low' },
  medium: { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800', label: 'Medium Confidence', icon: Shield, ringColor: '#f59e0b', ringGlow: 'match-ring-glow-amber', accent: 'match-card-accent-medium' },
  high: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800', label: 'High Confidence', icon: CheckCircle2, ringColor: '#10b981', ringGlow: 'match-ring-glow-emerald', accent: 'match-card-accent-high' },
}

const STATUS_CONFIG: Record<string, { color: string; label: string; dotClass: string; dotColor: string }> = {
  pending: { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800', label: 'Pending Review', dotClass: 'match-status-dot-pending', dotColor: 'bg-amber-500' },
  confirmed: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800', label: 'Confirmed Match', dotClass: 'match-status-dot-confirmed', dotColor: 'bg-emerald-500' },
  rejected: { color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700', label: 'Rejected', dotClass: '', dotColor: 'bg-gray-400' },
}

// ─── Animated Confidence Ring ────────────────────────────────────────────

function AnimatedConfidenceRing({ score, size = 110, confidence }: { score: number; size?: number; confidence: string }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const ref = useRef<SVGSVGElement>(null)

  const conf = CONFIDENCE_CONFIG[confidence as keyof typeof CONFIDENCE_CONFIG] || CONFIDENCE_CONFIG.medium
  const radius = (size - 14) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (animatedScore / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  // Background track segments
  const trackSegments = 60
  const segmentGap = 2

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        ref={ref}
        width={size}
        height={size}
        className={`-rotate-90 ${conf.ringGlow}`}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background track — dashed */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(0.8 0.02 155 / 30%)"
          strokeWidth="6"
          strokeDasharray={`${circumference / trackSegments - segmentGap} ${segmentGap}`}
          strokeLinecap="round"
        />
        {/* Animated progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={conf.ringColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        {/* Outer glow ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 4}
          fill="none"
          stroke={conf.ringColor}
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray={circumference * 1.07}
          initial={{ strokeDashoffset: circumference * 1.07 }}
          animate={{ strokeDashoffset: offset * 1.07 }}
          transition={{ duration: 1.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          opacity={0.3}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl font-bold tabular-nums"
          style={{ color: conf.ringColor }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4, type: 'spring' }}
        >
          {animatedScore}%
        </motion.span>
        <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">match</span>
      </div>
    </div>
  )
}

// ─── Face Scan Photo ─────────────────────────────────────────────────────

function FaceScanPhoto({
  src,
  alt,
  label,
  sublabel,
  borderColor = 'border-slate-200 dark:border-slate-700',
  gradientFrom = 'from-slate-200',
  gradientTo = 'to-slate-300',
}: {
  src: string | null
  alt: string
  label: string
  sublabel: string
  borderColor?: string
  gradientFrom?: string
  gradientTo?: string
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <div className="match-photo-frame w-20 h-20 sm:w-24 sm:h-24">
        <div className={`w-full h-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center overflow-hidden border-2 ${borderColor} rounded-xl`}>
          {src ? (
            <img src={src} alt={alt} className="w-full h-full object-cover" />
          ) : (
            <Users className="h-8 w-8 text-slate-400" />
          )}
        </div>
        {/* Face scan line */}
        <div className="match-face-scan-line" />
        {/* Face scan grid */}
        <div className="match-face-scan-grid" />
      </div>
      <div className="min-w-0 w-full">
        <p className="text-xs font-semibold truncate">{label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{sublabel}</p>
      </div>
    </div>
  )
}

// ─── Status Indicator Badge ──────────────────────────────────────────────

function StatusIndicatorBadge({ status }: { status: string }) {
  const conf = STATUS_CONFIG[status] || STATUS_CONFIG.pending

  return (
    <Badge variant="outline" className={`${conf.color} border text-[10px] gap-1.5 px-2 py-0.5`}>
      <span className={`relative flex h-2 w-2`}>
        {conf.dotClass && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${conf.dotColor} opacity-30 ${conf.dotClass}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${conf.dotColor}`} />
      </span>
      {conf.label}
    </Badge>
  )
}

// ─── Comparison Data Row ─────────────────────────────────────────────────

function ComparisonRow({
  icon: Icon,
  label,
  missingValue,
  foundValue,
  match,
}: {
  icon: React.ElementType
  label: string
  missingValue: string
  foundValue: string
  match: boolean
}) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground w-16 shrink-0">{label}</span>
      <span className={`flex-1 text-right truncate ${match ? 'match-data-match' : 'match-data-mismatch'}`}>
        {missingValue}
      </span>
      <ArrowRightLeft className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
      <span className={`flex-1 truncate ${match ? 'match-data-match' : 'match-data-mismatch'}`}>
        {foundValue}
      </span>
    </div>
  )
}

// ─── Feature Analysis Bar ────────────────────────────────────────────────

function FeatureBar({ label, value, color, delay }: { label: string; value: number; color: string; delay: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ─── Main MatchResultCard Component ──────────────────────────────────────

interface MatchResultCardProps {
  match: MatchData
  index: number
  onVerify?: (matchId: string, status: 'confirmed' | 'rejected') => void
  onViewDetails?: (match: MatchData) => void
  actionLoading?: string | null
}

export function MatchResultCard({ match, index, onVerify, onViewDetails, actionLoading }: MatchResultCardProps) {
  const [expanded, setExpanded] = useState(false)

  const conf = CONFIDENCE_CONFIG[match.confidence as keyof typeof CONFIDENCE_CONFIG] || CONFIDENCE_CONFIG.medium
  const ConfIcon = conf.icon

  const missingPhotos: string[] = (() => { try { return JSON.parse(match.missingChild.photos || '[]') } catch { return [] } })()
  const foundPhotos: string[] = (() => { try { return JSON.parse(match.foundChild.photos || '[]') } catch { return [] } })()

  const genderMatch = match.missingChild.gender === match.foundChild.gender
  const ageDiff = Math.abs(match.missingChild.age - match.foundChild.estimatedAge)
  const ageMatch = ageDiff <= 2

  // Simulated feature analysis
  const featureAnalysis = [
    { label: 'Facial Structure', value: Math.min(match.similarityScore + 5 + Math.random() * 5, 99), color: 'bg-emerald-500' },
    { label: 'Eye Region', value: Math.min(match.similarityScore + Math.random() * 10, 99), color: 'bg-teal-500' },
    { label: 'Nose Region', value: Math.min(match.similarityScore - 3 + Math.random() * 8, 99), color: 'bg-cyan-500' },
    { label: 'Mouth Region', value: Math.min(match.similarityScore - Math.random() * 8, 99), color: match.similarityScore > 70 ? 'bg-emerald-500' : 'bg-amber-500' },
  ]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="match-card-container"
    >
      {/* Top accent gradient */}
      <div className={`absolute inset-0 ${conf.accent} pointer-events-none rounded-2xl`} />

      <div className="relative p-4 sm:p-5 space-y-4">
        {/* ── Row 1: Status bar ──────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIndicatorBadge status={match.status} />
            <Badge className={`${conf.color} border text-[10px] gap-1`}>
              <ConfIcon className="h-3 w-3" />
              {conf.label}
            </Badge>
          </div>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(match.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* ── Row 2: Side-by-side comparison ─────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Missing child */}
          <div className="flex-1">
            <FaceScanPhoto
              src={missingPhotos[0] || null}
              alt={match.missingChild.fullName}
              label={match.missingChild.fullName}
              sublabel={`Age ${match.missingChild.age} • ${match.missingChild.gender}`}
              borderColor="border-amber-200 dark:border-amber-700"
              gradientFrom="from-amber-200"
              gradientTo="to-amber-300"
            />
          </div>

          {/* Center: Confidence Ring */}
          <div className="flex flex-col items-center shrink-0 match-compare-line px-1">
            <AnimatedConfidenceRing
              score={match.similarityScore}
              size={100}
              confidence={match.confidence}
            />
            <div className="flex items-center gap-0.5 mt-1">
              <Brain className="h-3 w-3 text-cyan-500" />
              <span className="text-[9px] text-muted-foreground">AI Match</span>
            </div>
          </div>

          {/* Found child */}
          <div className="flex-1">
            <FaceScanPhoto
              src={foundPhotos[0] || null}
              alt={match.foundChild.estimatedName || 'Unknown'}
              label={match.foundChild.estimatedName || 'Unidentified'}
              sublabel={`Est. Age ${match.foundChild.estimatedAge} • ${match.foundChild.gender}`}
              borderColor="border-emerald-200 dark:border-emerald-700"
              gradientFrom="from-emerald-200"
              gradientTo="to-teal-300"
            />
          </div>
        </div>

        {/* ── Row 3: Location info ───────────────────────────────── */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 text-amber-500 shrink-0" />
            {match.missingChild.lastSeenLocation}
          </span>
          <ArrowRightLeft className="h-3 w-3 text-muted-foreground/40 shrink-0 mx-1" />
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 text-emerald-500 shrink-0" />
            {match.foundChild.foundLocation}
          </span>
        </div>

        {/* ── Row 4: Expandable detail toggle ────────────────────── */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1 rounded-md hover:bg-muted/30"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Hide Details</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>View Comparison Details</span>
            </>
          )}
        </button>

        {/* ── Expandable Detail Section ──────────────────────────── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="match-detail-expand"
            >
              <div className="space-y-4 pt-1">
                <Separator />

                {/* Comparison Data Table */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <GitCompare className="h-3.5 w-3.5 text-cyan-500" />
                    Side-by-Side Comparison
                  </p>
                  <ComparisonRow
                    icon={Users}
                    label="Name"
                    missingValue={match.missingChild.fullName}
                    foundValue={match.foundChild.estimatedName || 'Unknown'}
                    match={false}
                  />
                  <ComparisonRow
                    icon={Calendar}
                    label="Age"
                    missingValue={`${match.missingChild.age}`}
                    foundValue={`~${match.foundChild.estimatedAge}`}
                    match={ageMatch}
                  />
                  <ComparisonRow
                    icon={Fingerprint}
                    label="Gender"
                    missingValue={match.missingChild.gender}
                    foundValue={match.foundChild.gender}
                    match={genderMatch}
                  />
                  <ComparisonRow
                    icon={MapPin}
                    label="Location"
                    missingValue={match.missingChild.lastSeenLocation}
                    foundValue={match.foundChild.foundLocation}
                    match={false}
                  />
                </div>

                <Separator />

                {/* AI Feature Analysis */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Brain className="h-3.5 w-3.5 text-emerald-500" />
                    AI Feature Analysis
                  </p>
                  <div className="space-y-2.5">
                    {featureAnalysis.map((feat, i) => (
                      <FeatureBar
                        key={feat.label}
                        label={feat.label}
                        value={feat.value}
                        color={feat.color}
                        delay={0.3 + i * 0.15}
                      />
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Case details */}
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-muted-foreground">Case #</span>
                    <p className="font-mono font-medium">{match.missingChild.caseNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Health Status</span>
                    <p className="font-medium">{match.foundChild.healthStatus}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Missing Status</span>
                    <Badge variant="outline" className="text-[10px] mt-0.5 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                      {match.missingChild.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Found Status</span>
                    <Badge variant="outline" className="text-[10px] mt-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
                      {match.foundChild.status}
                    </Badge>
                  </div>
                </div>

                {/* Verified by info */}
                {match.verified && match.verifier && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-emerald-700 dark:text-emerald-300">
                      Verified by <strong>{match.verifier.name}</strong>
                    </span>
                  </div>
                )}

                {/* AI Pipeline Steps */}
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-cyan-500" />
                    AI Pipeline Stages
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { icon: ScanFace, label: 'Detect' },
                      { icon: Cpu, label: 'Embed' },
                      { icon: Network, label: 'Compare' },
                      { icon: GitCompare, label: 'Score' },
                      { icon: UserCheck, label: 'Verify' },
                    ].map((step, i) => (
                      <div key={step.label} className="flex items-center gap-1">
                        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md px-1.5 py-0.5">
                          <step.icon className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-[9px] font-medium text-emerald-700 dark:text-emerald-300">{step.label}</span>
                        </div>
                        {i < 4 && <span className="text-muted-foreground/30">→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Row 5: Action Buttons ──────────────────────────────── */}
        {match.status === 'pending' ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
              disabled={actionLoading === match.id}
              onClick={() => onVerify?.(match.id, 'confirmed')}
            >
              {actionLoading === match.id ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              Verify Match
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30 text-xs h-8"
              disabled={actionLoading === match.id}
              onClick={() => onVerify?.(match.id, 'rejected')}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-8 px-2"
              onClick={() => onViewDetails?.(match)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8"
              onClick={() => onViewDetails?.(match)}
            >
              <Eye className="h-3 w-3 mr-1" /> View Full Details
            </Button>
            {match.status === 'confirmed' && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              >
                <Heart className="h-3 w-3 mr-1" /> Reunification
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Skeleton Card ───────────────────────────────────────────────────────

export function MatchCardSkeleton() {
  return (
    <div className="match-card-container animate-pulse">
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-muted rounded-xl" />
          <div className="w-24 h-24 bg-muted rounded-full" />
          <div className="w-20 h-20 bg-muted rounded-xl" />
        </div>
        <div className="h-8 bg-muted rounded-lg" />
        <div className="h-6 bg-muted rounded w-40 mx-auto" />
      </div>
    </div>
  )
}
