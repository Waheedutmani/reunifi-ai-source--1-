'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

// ─── Custom Easing Functions ────────────────────────────────────────────

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

// Blend easing: start slow, accelerate in middle, decelerate at end
function easeSmooth(t: number): number {
  if (t < 0.5) {
    return easeOutQuart(t * 2) * 0.5
  }
  return 0.5 + easeOutExpo((t - 0.5) * 2) * 0.5
}

// ─── useAnimatedCounter Hook (enhanced) ──────────────────────────────────

function useAnimatedCounter(
  target: number,
  duration: number = 2200,
  delay: number = 0,
  enabled: boolean = true
) {
  const isTargetZero = target === 0
  const [count, setCount] = useState(enabled ? (isTargetZero ? 0 : 0) : target)
  const [isComplete, setIsComplete] = useState(!enabled || isTargetZero)
  const [progress, setProgress] = useState(isTargetZero ? 1 : 0)

  useEffect(() => {
    if (!enabled || isTargetZero) return

    let startTime: number | null = null
    let animationFrame: number
    let cancelled = false

    const startAfterDelay = () => {
      const timer = setTimeout(() => {
        if (!cancelled) {
          animationFrame = requestAnimationFrame(animate)
        }
      }, delay)
      return timer
    }

    const animate = (timestamp: number) => {
      if (cancelled) return
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const rawProgress = Math.min(elapsed / duration, 1)
      const easedProgress = easeSmooth(rawProgress)
      const currentValue = Math.floor(easedProgress * target)

      setCount(currentValue)
      setProgress(rawProgress)

      if (rawProgress < 1) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        setCount(target)
        setProgress(1)
        setIsComplete(true)
      }
    }

    const timer = startAfterDelay()

    return () => {
      cancelled = true
      clearTimeout(timer)
      cancelAnimationFrame(animationFrame)
    }
  }, [target, duration, delay, enabled])

  return { count, isComplete, progress }
}

// ─── Sparkle Burst Effect ───────────────────────────────────────────────

function SparkleEffect({ color, show }: { color: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2 + Math.PI / 8
            const distance = 22 + Math.random() * 28
            const x = Math.cos(angle) * distance
            const y = Math.sin(angle) * distance
            const size = 3 + Math.random() * 3
            return (
              <motion.div
                key={`spark-${i}`}
                initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [1, 0.9, 0],
                  x: [0, x],
                  y: [0, y],
                }}
                transition={{
                  duration: 0.7,
                  delay: i * 0.04,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                style={{
                  position: 'absolute',
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  backgroundColor: color,
                  left: '50%',
                  top: '50%',
                  pointerEvents: 'none',
                  boxShadow: `0 0 6px ${color}40`,
                }}
              />
            )
          })}
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Animated Ring Progress ─────────────────────────────────────────────

function StatRingProgress({
  value,
  maxValue,
  color,
  size = 52,
  strokeWidth = 3,
  delay = 0,
}: {
  value: number
  maxValue: number
  color: string
  size?: number
  strokeWidth?: number
  delay?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = maxValue > 0 ? Math.min(value / maxValue, 1) : 0
  const offset = circumference * (1 - percentage)

  return (
    <svg
      width={size}
      height={size}
      className="-rotate-90"
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      {/* Progress arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{
          duration: 2,
          delay: delay + 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      />
      {/* Outer glow ring */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius + 4}
        fill="none"
        stroke={color}
        strokeWidth={0.8}
        strokeLinecap="round"
        strokeDasharray={circumference * 1.1}
        initial={{ strokeDashoffset: circumference * 1.1, opacity: 0 }}
        animate={{ strokeDashoffset: offset * 1.1, opacity: 0.2 }}
        transition={{
          duration: 2,
          delay: delay + 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
      />
    </svg>
  )
}

// ─── Counter Digit with rolling animation ───────────────────────────────

function CounterDigit({ digit, index, delay }: { digit: string; index: number; delay: number }) {
  if (digit === ',') {
    return <span className="stat-number" style={{ opacity: 0.5 }}>,</span>
  }

  return (
    <motion.span
      className="stat-number inline-block"
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: delay + index * 0.05,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      {digit}
    </motion.span>
  )
}

// ─── AnimatedStatCard ───────────────────────────────────────────────────

interface AnimatedStatCardProps {
  title: string
  value: number
  maxValue?: number
  icon: React.ElementType
  trend: string
  trendUp: boolean
  gradient: string
  glowColor: string
  ringColor: string
  sparkleColor: string
  delay: number
  loading: boolean
}

export function AnimatedStatCard({
  title,
  value,
  maxValue = 300,
  icon: Icon,
  trend,
  trendUp,
  gradient,
  glowColor,
  ringColor,
  sparkleColor,
  delay,
  loading,
}: AnimatedStatCardProps) {
  const { count, isComplete, progress } = useAnimatedCounter(value, 2400, delay * 120, !loading)
  const [showPulse, setShowPulse] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isComplete && !loading) {
      const t = setTimeout(() => setShowPulse(true), 50)
      const h = setTimeout(() => setShowPulse(false), 1500)
      return () => { clearTimeout(t); clearTimeout(h) }
    }
  }, [isComplete, loading])

  const formattedCount = count.toLocaleString()
  const animDelay = delay * 0.12

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.7,
        delay: animDelay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`stat-hero-card ${glowColor} ${showPulse ? 'stat-pulse-complete' : ''} relative`}
    >
      {/* Top gradient accent overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.05] dark:opacity-[0.08] pointer-events-none rounded-[20px]`} />

      {/* Animated progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden rounded-t-[20px]">
        <motion.div
          className="h-full stat-bar-animated"
          style={{
            background: `linear-gradient(90deg, transparent, ${ringColor}, transparent)`,
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(progress * 100, 100)}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      <div className="relative p-4 sm:p-5">
        {/* Top row: icon + ring */}
        <div className="flex items-start justify-between mb-3">
          <motion.div
            className={`rounded-xl p-2.5 ${gradient} shadow-lg`}
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.6,
              delay: animDelay + 0.15,
              type: 'spring',
              stiffness: 200,
              damping: 14,
            }}
          >
            <Icon className="h-5 w-5 text-white" />
          </motion.div>

          <div className="relative">
            <StatRingProgress
              value={count}
              maxValue={maxValue}
              color={ringColor}
              size={48}
              strokeWidth={3}
              delay={animDelay}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                className="text-[9px] font-bold text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: animDelay + 0.8 }}
              >
                {maxValue > 0 ? Math.round((count / maxValue) * 100) : 0}%
              </motion.span>
            </div>
          </div>
        </div>

        {/* Counter number */}
        <div className="relative mb-2 min-h-[2.5rem]">
          {loading ? (
            <div className="h-10 w-24 bg-muted/40 rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-baseline">
              {formattedCount.split('').map((char, i) => (
                <CounterDigit
                  key={`digit-${i}`}
                  digit={char}
                  index={i}
                  delay={animDelay + 0.3}
                />
              ))}
            </div>
          )}
          <SparkleEffect color={sparkleColor} show={isComplete} />
        </div>

        {/* Title */}
        <motion.p
          className="text-xs sm:text-sm font-medium text-muted-foreground mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animDelay + 0.5 }}
        >
          {title}
        </motion.p>

        {/* Trend indicator */}
        {!loading && (
          <motion.div
            className="flex items-center gap-1"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: animDelay + 0.9 }}
          >
            {trendUp ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
            )}
            <span
              className={`text-xs font-semibold ${
                trendUp
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend}
            </span>
            <span className="text-[10px] text-muted-foreground">vs last month</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Large Hero Stat (for top-level summary) ─────────────────────────────

interface HeroStatProps {
  icon: React.ElementType
  label: string
  value: number
  suffix?: string
  color: string
  ringColor: string
  bgColor: string
  delay: number
  loading: boolean
}

export function HeroStat({
  icon: Icon,
  label,
  value,
  suffix = '',
  color,
  ringColor,
  bgColor,
  delay,
  loading,
}: HeroStatProps) {
  const { count, isComplete, progress } = useAnimatedCounter(value, 2500, delay * 150, !loading)
  const [showPulse, setShowPulse] = useState(false)

  useEffect(() => {
    if (isComplete && !loading) {
      const t = setTimeout(() => setShowPulse(true), 50)
      const h = setTimeout(() => setShowPulse(false), 1500)
      return () => { clearTimeout(t); clearTimeout(h) }
    }
  }, [isComplete, loading])

  const formattedCount = count.toLocaleString()
  const animDelay = delay * 0.1

  return (
    <motion.div
      initial={{ opacity: 0, y: 25, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.7,
        delay: animDelay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={`stat-hero-card ${showPulse ? 'stat-pulse-complete' : ''} text-center`}
    >
      <div className="relative p-5 sm:p-6">
        {/* Top progress bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden rounded-t-[20px]">
          <motion.div
            className="h-full stat-bar-animated"
            style={{
              background: `linear-gradient(90deg, transparent, ${ringColor}, transparent)`,
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(progress * 100, 100)}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Icon */}
        <motion.div
          className={`mx-auto mb-3 w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center shadow-lg`}
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            duration: 0.5,
            delay: animDelay + 0.15,
            type: 'spring',
            stiffness: 180,
            damping: 12,
          }}
        >
          <Icon className="h-6 w-6 text-white" />
        </motion.div>

        {/* Number */}
        <div className="relative mb-1 min-h-[3rem]">
          {loading ? (
            <div className="h-12 w-20 bg-muted/40 rounded-lg animate-pulse mx-auto" />
          ) : (
            <div className="flex items-baseline justify-center">
              {formattedCount.split('').map((char, i) => (
                <CounterDigit
                  key={`hero-digit-${i}`}
                  digit={char}
                  index={i}
                  delay={animDelay + 0.3}
                />
              ))}
              {suffix && (
                <motion.span
                  className="text-2xl sm:text-3xl font-bold opacity-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ delay: animDelay + 1 }}
                >
                  {suffix}
                </motion.span>
              )}
            </div>
          )}
          <SparkleEffect color={ringColor} show={isComplete} />
        </div>

        {/* Label */}
        <motion.p
          className="text-xs sm:text-sm font-medium text-muted-foreground mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animDelay + 0.5 }}
        >
          {label}
        </motion.p>

        {/* Progress bar */}
        <div className="mt-3 h-1 w-full rounded-full bg-muted/50 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: ringColor }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((value / 300) * 100, 100)}%` }}
            transition={{
              duration: 2,
              delay: animDelay + 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
        </div>
      </div>
    </motion.div>
  )
}
