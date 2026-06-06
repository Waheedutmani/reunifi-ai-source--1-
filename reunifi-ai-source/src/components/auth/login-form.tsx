'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2,
  Shield,
  Eye,
  EyeOff,
  Moon,
  Sun,
  ChevronRight,
  Sparkles,
  Fingerprint,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react'
import { useAppStore, type AppUser } from '@/store/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from 'next-themes'
import { getDefaultView, getDashboardTitle, type RBACViewType } from '@/lib/rbac'
import { safeJsonParse, checkApiHealth } from '@/lib/safe-fetch'

interface LoginFormProps {
  onSwitchToSignup: () => void
  onForgotPassword: () => void
}

const SLIDE_TEXTS = [
  'Helping Families Reunite Through AI',
  'AI-Powered Child Recovery Platform',
  'Smart Facial Recognition System',
]

const SLIDE_GRADIENTS = [
  'from-slate-900 via-cyan-950 to-slate-950',
  'from-cyan-950 via-slate-900 to-teal-950',
  'from-slate-950 via-teal-950 to-slate-900',
]

const SLIDE_ICONS = [Sparkles, Fingerprint, Shield]

const SLIDE_BG_IMAGES = [
  'linear-gradient(135deg, #0c1220 0%, #0a2540 30%, #0d3b66 60%, #0c1220 100%)',
  'linear-gradient(135deg, #0c1220 0%, #0a2f4f 30%, #0e4d6e 60%, #0c1220 100%)',
  'linear-gradient(135deg, #0c1220 0%, #0a1f3f 30%, #0d3055 60%, #0c1220 100%)',
]

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@reunifi.ai', password: 'Admin@123', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10', glow: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]' },
  { label: 'Police', email: 'police@reunifi.ai', password: 'Police@123', color: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/10', glow: 'hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]' },
  { label: 'NGO', email: 'ngo@reunifi.ai', password: 'NGO@123', color: 'text-teal-400', border: 'border-teal-500/30', bg: 'bg-teal-500/10', glow: 'hover:shadow-[0_0_20px_rgba(45,212,191,0.25)]' },
  { label: 'Parent', email: 'parent@reunifi.ai', password: 'Parent@123', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', glow: 'hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]' },
]

/* ────────────────────────────────────────────────────────────
   Particle System — Canvas-based neural network visualization
   ──────────────────────────────────────────────────────────── */
const PARTICLE_COUNT = 28
const CONNECTION_DISTANCE = 130

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialize particles
    const w = canvas.width
    const h = canvas.height
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      size: 2 + Math.random() * 6,
      opacity: 0.1 + Math.random() * 0.3,
    }))

    const animate = () => {
      const cw = canvas.width
      const ch = canvas.height
      ctx.clearRect(0, 0, cw, ch)

      const particles = particlesRef.current

      // Update positions
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > cw) p.vx *= -1
        if (p.y < 0 || p.y > ch) p.vy *= -1
        p.x = Math.max(0, Math.min(cw, p.x))
        p.y = Math.max(0, Math.min(ch, p.y))
      }

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECTION_DISTANCE) {
            const lineOpacity = (1 - dist / CONNECTION_DISTANCE) * 0.25
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(34, 211, 238, ${lineOpacity})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34, 211, 238, ${p.opacity})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2)
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5)
        grad.addColorStop(0, `rgba(34, 211, 238, ${p.opacity * 0.3})`)
        grad.addColorStop(1, 'rgba(34, 211, 238, 0)')
        ctx.fillStyle = grad
        ctx.fill()
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 2 }}
    />
  )
}

/* ────────────────────────────────────────────────────────────
   Face Scanner Overlay
   ──────────────────────────────────────────────────────────── */
function FaceScannerOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
      {/* Face oval outline */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 rounded-[50%] border border-cyan-400/20" />

      {/* Face grid lines */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 overflow-hidden rounded-[50%]">
        {[20, 40, 60, 80].map((left) => (
          <div
            key={`v-${left}`}
            className="absolute top-0 bottom-0 w-px bg-cyan-400/8"
            style={{ left: `${left}%` }}
          />
        ))}
        {[20, 40, 60, 80].map((top) => (
          <div
            key={`h-${top}`}
            className="absolute left-0 right-0 h-px bg-cyan-400/8"
            style={{ top: `${top}%` }}
          />
        ))}

        {/* Scanning line */}
        <motion.div
          animate={{ top: ['0%', '100%'] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
          className="absolute left-0 right-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.6), rgba(16,185,129,0.8), rgba(34,211,238,0.6), transparent)',
            boxShadow: '0 0 12px rgba(34,211,238,0.5), 0 0 24px rgba(16,185,129,0.3)',
          }}
        />
      </div>

      {/* Corner brackets */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-72">
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400/40 rounded-tl-sm" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400/40 rounded-tr-sm" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400/40 rounded-bl-sm" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400/40 rounded-br-sm" />
      </div>

      {/* Scan status text */}
      <motion.div
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[28%] left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-widest text-cyan-400/60 uppercase"
      >
        Biometric Scan Active
      </motion.div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   Animated Counter
   ──────────────────────────────────────────────────────────── */
function AnimatedCounter({
  target,
  suffix = '',
  duration = 2200,
  delay = 0,
  decimals = 0,
}: {
  target: number
  suffix?: string
  duration?: number
  delay?: number
  decimals?: number
}) {
  const [value, setValue] = useState(0)
  const startedRef = useRef(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      startedRef.current = true
      const startTime = performance.now()

      const step = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(eased * target)
        if (progress < 1) {
          requestAnimationFrame(step)
        }
      }
      requestAnimationFrame(step)
    }, delay)

    return () => clearTimeout(timeout)
  }, [target, duration, delay])

  const formatted = decimals > 0
    ? value.toFixed(decimals)
    : Math.round(value).toLocaleString()

  return (
    <span>
      {formatted}{suffix}
    </span>
  )
}

/* ────────────────────────────────────────────────────────────
   Background Image Overlay with AI-Themed SVGs
   ──────────────────────────────────────────────────────────── */
function BackgroundImageOverlay({ currentSlide }: { currentSlide: number }) {
  return (
    <div className="absolute inset-0" style={{ zIndex: 1 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${currentSlide}`}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0"
          style={{ background: SLIDE_BG_IMAGES[currentSlide] }}
        />
      </AnimatePresence>

      {/* Decorative SVG elements based on slide theme */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`svg-${currentSlide}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.06 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {currentSlide === 0 && (
            /* Family/Heart SVG */
            <svg viewBox="0 0 200 200" className="w-96 h-96 text-cyan-400">
              <path d="M100 180 C40 140, 10 80, 50 50 C70 30, 90 40, 100 60 C110 40, 130 30, 150 50 C190 80, 160 140, 100 180Z" fill="currentColor" />
              <circle cx="70" cy="30" r="12" fill="currentColor" opacity="0.5" />
              <circle cx="130" cy="30" r="12" fill="currentColor" opacity="0.5" />
              <circle cx="100" cy="15" r="8" fill="currentColor" opacity="0.3" />
            </svg>
          )}
          {currentSlide === 1 && (
            /* Search/Locate SVG */
            <svg viewBox="0 0 200 200" className="w-96 h-96 text-teal-400">
              <circle cx="90" cy="90" r="50" fill="none" stroke="currentColor" strokeWidth="8" />
              <line x1="125" y1="125" x2="170" y2="170" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              <circle cx="90" cy="90" r="20" fill="currentColor" opacity="0.3" />
              <circle cx="90" cy="90" r="8" fill="currentColor" />
            </svg>
          )}
          {currentSlide === 2 && (
            /* Face/AI Scan SVG */
            <svg viewBox="0 0 200 200" className="w-96 h-96 text-cyan-400">
              <rect x="30" y="20" width="140" height="160" rx="70" fill="none" stroke="currentColor" strokeWidth="4" />
              <line x1="30" y1="60" x2="60" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="30" y1="100" x2="60" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="30" y1="140" x2="60" y2="140" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="140" y1="60" x2="170" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="140" y1="100" x2="170" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="140" y1="140" x2="170" y2="140" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <circle cx="80" cy="80" r="8" fill="currentColor" opacity="0.4" />
              <circle cx="120" cy="80" r="8" fill="currentColor" opacity="0.4" />
              <path d="M75 120 Q100 140, 125 120" fill="none" stroke="currentColor" strokeWidth="3" opacity="0.4" />
            </svg>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────
   Main Login Form Component
   ──────────────────────────────────────────────────────────── */
export function LoginForm({ onSwitchToSignup, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [typedText, setTypedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  // CAPTCHA state
  const [captchaRequired, setCaptchaRequired] = useState(false)
  const [captchaId, setCaptchaId] = useState('')
  const [captchaQuestion, setCaptchaQuestion] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)

  // Account lockout state
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [lockedUntil, setLockedUntil] = useState(0)

  const login = useAppStore((s) => s.login)
  const navigateTo = useAppStore((s) => s.navigateTo)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  // Auto-rotate slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_TEXTS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Typing animation for slide text
  useEffect(() => {
    setIsTyping(true)
    setTypedText('')
    const text = SLIDE_TEXTS[currentSlide]
    let i = 0
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        setTypedText(text.slice(0, i + 1))
        i++
      } else {
        setIsTyping(false)
        clearInterval(typeInterval)
      }
    }, 40)
    return () => clearInterval(typeInterval)
  }, [currentSlide])

  // Server reachability state
  const [serverUnreachable, setServerUnreachable] = useState(false)

  // Fetch CAPTCHA when required
  const fetchCaptcha = useCallback(async () => {
    setCaptchaLoading(true)
    try {
      const res = await fetch('/api/auth')
      if (res.ok) {
        const data = await safeJsonParse<{ captchaId: string; question: string }>(res)
        setCaptchaId(data.captchaId)
        setCaptchaQuestion(data.question)
        setCaptchaAnswer('')
      }
    } catch {
      // Fallback: generate client-side captcha
      const a = Math.floor(Math.random() * 15) + 1
      const b = Math.floor(Math.random() * 15) + 1
      setCaptchaId(`local-${Date.now()}`)
      setCaptchaQuestion(`${a} + ${b} = ?`)
      setCaptchaAnswer(String(a + b))
    } finally {
      setCaptchaLoading(false)
    }
  }, [])

  // Check server reachability on mount
  useEffect(() => {
    let cancelled = false
    checkApiHealth().then((ok) => {
      if (!cancelled) setServerUnreachable(!ok)
    })
    return () => { cancelled = true }
  }, [])

  // Check for saved session on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('reunifi_token')
      const savedUser = localStorage.getItem('reunifi_user')
      if (savedToken && savedUser && rememberMe) {
        const user = JSON.parse(savedUser)
        login(user, savedToken)
        navigateTo('dashboard')
      }
    } catch {
      // Ignore
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    if (captchaRequired && !captchaAnswer) {
      toast({
        title: 'CAPTCHA Required',
        description: 'Please solve the CAPTCHA to continue',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          captchaId: captchaRequired ? captchaId : undefined,
          captchaAnswer: captchaRequired ? captchaAnswer : undefined,
        }),
      })

      const data = await safeJsonParse<Record<string, any>>(res)

      if (!res.ok) {
        // Handle account lockout
        if (data.locked) {
          setIsLocked(true)
          setLockedUntil(data.lockedUntil as number)
          toast({
            title: 'Account Locked',
            description: data.error as string,
            variant: 'destructive',
          })
          return
        }

        // Handle CAPTCHA requirement
        if (data.captchaRequired || (data.remainingAttempts as number) <= 3) {
          setCaptchaRequired(true)
          fetchCaptcha()
        }

        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts as number)
        }

        throw new Error((data.error as string) || 'Login failed')
      }

      setServerUnreachable(false)
      login(data.user as AppUser, data.token as string)
      const defaultView = getDefaultView((data.user as AppUser).role)
      navigateTo(defaultView as 'dashboard')
      toast({
        title: `Welcome to ${getDashboardTitle((data.user as AppUser).role)}!`,
        description: `Signed in as ${(data.user as AppUser).name}`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials'
      if (msg.includes('Unable to connect') || msg.includes('unexpected response') || msg.includes('Server error')) {
        setServerUnreachable(true)
      }
      toast({
        title: 'Login Failed',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [email, password, login, navigateTo, toast, captchaRequired, captchaId, captchaAnswer, fetchCaptcha])

  const handleDemoLogin = useCallback(async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPassword }),
      })

      const data = await safeJsonParse<Record<string, any>>(res)

      if (!res.ok) {
        throw new Error((data.error as string) || 'Login failed')
      }

      setServerUnreachable(false)
      login(data.user as AppUser, data.token as string)
      const defaultView = getDefaultView((data.user as AppUser).role)
      navigateTo(defaultView as 'dashboard')
      toast({
        title: `Welcome to ${getDashboardTitle((data.user as AppUser).role)}!`,
        description: `Signed in as ${(data.user as AppUser).name}`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials'
      if (msg.includes('Unable to connect') || msg.includes('unexpected response') || msg.includes('Server error')) {
        setServerUnreachable(true)
      }
      toast({
        title: 'Login Failed',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [login, navigateTo, toast])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const CurrentSlideIcon = SLIDE_ICONS[currentSlide]

  // Lockout timer
  const [lockCountdown, setLockCountdown] = useState('')
  useEffect(() => {
    if (!isLocked || !lockedUntil) return
    const updateCountdown = () => {
      const remaining = lockedUntil - Date.now()
      if (remaining <= 0) {
        setIsLocked(false)
        setLockedUntil(0)
        setLockCountdown('')
        return
      }
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      setLockCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [isLocked, lockedUntil])

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* ==================== LEFT SIDE - Image Slider ==================== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background image overlay */}
        <BackgroundImageOverlay currentSlide={currentSlide} />

        {/* Background gradient slider */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className={`absolute inset-0 bg-gradient-to-br ${SLIDE_GRADIENTS[currentSlide]}`}
          />
        </AnimatePresence>

        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(34,211,238,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating AI Particles */}
        <ParticleCanvas />

        {/* Face Scanner Overlay */}
        <FaceScannerOverlay />

        {/* Animated floating orbs */}
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl"
          style={{ zIndex: 1 }}
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 30, -20, 0],
            scale: [1, 0.9, 1.3, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl"
          style={{ zIndex: 1 }}
        />
        <motion.div
          animate={{
            x: [0, 20, -30, 0],
            y: [0, -20, 30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cyan-400/5 blur-3xl"
          style={{ zIndex: 1 }}
        />

        {/* Slider content */}
        <div className="relative flex flex-col items-center justify-center w-full px-12" style={{ zIndex: 10 }}>
          {/* Icon with pulse animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`icon-${currentSlide}`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mb-5 relative"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 backdrop-blur-sm">
                <CurrentSlideIcon className="h-8 w-8 text-cyan-400" />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-2xl border-2 border-cyan-400/40"
              />
              <motion.div
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.2, 0, 0.2],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.4,
                }}
                className="absolute inset-0 rounded-2xl border border-cyan-400/20"
              />
            </motion.div>
          </AnimatePresence>

          {/* Typing text */}
          <div className="min-h-[50px] flex items-center justify-center">
            <h2 className="text-2xl xl:text-3xl font-bold text-white text-center leading-tight">
              {typedText}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                className="inline-block w-[2px] h-6 bg-cyan-400 ml-1 align-middle"
              />
            </h2>
          </div>

          {/* Subtitle */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`sub-${currentSlide}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="mt-3 text-sm text-cyan-200/60 text-center max-w-md"
            >
              {currentSlide === 0 && 'Reuniting families with cutting-edge artificial intelligence technology'}
              {currentSlide === 1 && 'Comprehensive platform for tracking and recovering missing children'}
              {currentSlide === 2 && 'Advanced biometric matching powered by deep learning algorithms'}
            </motion.p>
          </AnimatePresence>

          {/* Slide indicators */}
          <div className="flex gap-3 mt-6">
            {SLIDE_TEXTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className="group relative"
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === currentSlide
                      ? 'w-10 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                      : 'w-4 bg-white/20 hover:bg-white/40'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Bottom stats */}
          <div className="mt-8 grid grid-cols-3 gap-6 text-center">
            {[
              { value: 2847, label: 'Children Found', suffix: '', decimals: 0, delay: 300 },
              { value: 98.5, label: 'Match Accuracy', suffix: '%', decimals: 1, delay: 600 },
              { value: 0, label: 'AI Monitoring', suffix: '', decimals: 0, delay: 900, is247: true },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-xl font-bold text-cyan-400"
                >
                  {stat.is247 ? (
                    <span>
                      <AnimatedCounter target={24} suffix="" duration={1500} delay={stat.delay} />/
                      <AnimatedCounter target={7} suffix="" duration={1200} delay={stat.delay + 400} />
                    </span>
                  ) : (
                    <AnimatedCounter
                      target={stat.value}
                      suffix={stat.suffix}
                      duration={2200}
                      delay={stat.delay}
                      decimals={stat.decimals}
                    />
                  )}
                </div>
                <div className="text-[11px] text-cyan-200/40 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== RIGHT SIDE - Login Form ==================== */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950/50 relative min-h-screen lg:min-h-0">
        {/* Mobile background effects */}
        <div className="absolute inset-0 overflow-hidden lg:hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-3xl" />
        </div>

        {/* Theme toggle */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={toggleTheme}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Logo & Header */}
          <div className="text-center mb-4">
            <div className="mx-auto mb-2 relative inline-block">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 shadow-lg shadow-cyan-500/25">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 via-cyan-800 to-teal-700 dark:from-white dark:via-cyan-200 dark:to-teal-300 bg-clip-text text-transparent">
              Reunifi AI
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sign in to the recovery platform
            </p>
          </div>

          {/* Account Lockout Banner */}
          <AnimatePresence>
            {isLocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <Lock className="h-4 w-4 text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400">Account Locked — Try again in {lockCountdown}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Server Unreachable Warning */}
          <AnimatePresence>
            {serverUnreachable && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-400 flex-1">Server Unreachable</p>
                  <button
                    onClick={async () => {
                      const ok = await checkApiHealth()
                      setServerUnreachable(!ok)
                    }}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline underline-offset-2"
                  >
                    Retry
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Remaining Attempts Warning */}
          <AnimatePresence>
            {remainingAttempts !== null && remainingAttempts <= 3 && remainingAttempts > 0 && !isLocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before lockout
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glassmorphism Card */}
          <Card className="border-slate-200/60 dark:border-cyan-500/20 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl dark:shadow-cyan-500/5 rounded-2xl overflow-hidden">
            {/* Top glow line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                Welcome Back
              </CardTitle>
            </CardHeader>

            <CardContent className="px-5 pb-4 space-y-3">
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || isLocked}
                    className="h-10 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20 dark:focus-visible:border-cyan-400 dark:focus-visible:ring-cyan-400/20 rounded-xl pl-4 text-sm transition-all duration-300"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading || isLocked}
                      className="h-10 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20 dark:focus-visible:border-cyan-400 dark:focus-visible:ring-cyan-400/20 rounded-xl pr-10 text-sm transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* CAPTCHA */}
                <AnimatePresence>
                  {captchaRequired && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-1.5"
                    >
                      <Label className="text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5">
                        <Shield className="h-3 w-3" />
                        Security Verification
                      </Label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800">
                          <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300">
                            {captchaQuestion}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-cyan-500 hover:text-cyan-600"
                            onClick={fetchCaptcha}
                            disabled={captchaLoading}
                          >
                            <RefreshCw className={`h-3 w-3 ${captchaLoading ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                        <Input
                          value={captchaAnswer}
                          onChange={(e) => setCaptchaAnswer(e.target.value)}
                          placeholder="Answer"
                          disabled={loading}
                          className="h-9 w-20 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus-visible:border-cyan-500 rounded-lg text-sm text-center"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                      className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                    <Label
                      htmlFor="remember"
                      className="text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer select-none"
                    >
                      Remember me
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={onForgotPassword}
                    className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  disabled={loading || isLocked}
                  className="w-full h-10 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 rounded-xl font-semibold text-sm relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </span>
                </Button>
              </form>

              {/* Demo Accounts */}
              <div>
                <div className="relative mb-2">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm px-2 text-cyan-600 dark:text-cyan-400 font-semibold">
                      Demo Accounts
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.label}
                      type="button"
                      onClick={() => handleDemoLogin(account.email, account.password)}
                      disabled={loading || isLocked}
                      className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border ${account.border} ${account.bg} ${account.glow} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className={`text-[11px] font-bold ${account.color}`}>
                        {account.label}
                      </span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate w-full text-center">
                        {account.email}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Signup redirect */}
              <div className="text-center text-xs pt-1">
                <span className="text-slate-500 dark:text-slate-400">
                  Don&apos;t have an account?{' '}
                </span>
                <button
                  onClick={onSwitchToSignup}
                  className="font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Bottom tagline */}
          <p className="text-center mt-3 text-[10px] text-slate-400 dark:text-slate-600">
            Reunifi AI — Secure & Confidential
          </p>
        </motion.div>
      </div>
    </div>
  )
}
