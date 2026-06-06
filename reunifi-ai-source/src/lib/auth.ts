import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'reunifi-ai-secret-key-2024-secure'
const JWT_EXPIRES_IN = '24h'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  name: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return null
}

export function getAuthUser(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}

// Login attempt limiter - in-memory store (resets on server restart)
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()
const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutes

export function checkLoginAttempts(email: string): { allowed: boolean; remainingAttempts: number; lockedUntil: number } {
  const attempts = loginAttempts.get(email)
  
  if (!attempts) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockedUntil: 0 }
  }

  if (attempts.lockedUntil > Date.now()) {
    return { allowed: false, remainingAttempts: 0, lockedUntil: attempts.lockedUntil }
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    // Lock has expired, reset
    loginAttempts.delete(email)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS, lockedUntil: 0 }
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - attempts.count, lockedUntil: 0 }
}

export function recordFailedAttempt(email: string): void {
  const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: 0 }
  attempts.count += 1
  
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + LOCK_DURATION_MS
  }
  
  loginAttempts.set(email, attempts)
}

export function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email)
}

// Simple CAPTCHA system
const captchaStore = new Map<string, { answer: string; expiresAt: number }>()

export function generateCaptcha(): { id: string; question: string; answer: string } {
  const operations = ['+', '-', '×']
  const op = operations[Math.floor(Math.random() * operations.length)]
  let a: number, b: number, answer: number

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * 20) + 1
      b = Math.floor(Math.random() * 20) + 1
      answer = a + b
      break
    case '-':
      a = Math.floor(Math.random() * 20) + 10
      b = Math.floor(Math.random() * a) + 1
      answer = a - b
      break
    case '×':
      a = Math.floor(Math.random() * 10) + 1
      b = Math.floor(Math.random() * 10) + 1
      answer = a * b
      break
    default:
      a = 1; b = 1; answer = 2
  }

  const id = `captcha-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const question = `${a} ${op} ${b} = ?`
  
  captchaStore.set(id, { answer: String(answer), expiresAt: Date.now() + 5 * 60 * 1000 })
  
  // Clean up expired captchas
  for (const [key, value] of captchaStore) {
    if (value.expiresAt < Date.now()) captchaStore.delete(key)
  }

  return { id, question, answer: String(answer) }
}

export function verifyCaptcha(id: string, userAnswer: string): boolean {
  const captcha = captchaStore.get(id)
  if (!captcha) return false
  if (captcha.expiresAt < Date.now()) {
    captchaStore.delete(id)
    return false
  }
  const isValid = captcha.answer === userAnswer.trim()
  captchaStore.delete(id)
  return isValid
}
