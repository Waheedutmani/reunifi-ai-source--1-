'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Bot,
  User,
  Sparkles,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

// ─── Types ───────────────────────────────────────────────────────────
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ─── Predefined Fallback Responses (lightweight, no AI model) ───────
const PREDEFINED_RESPONSES: Array<{ keywords: string[]; response: string }> = [
  {
    keywords: ['report', 'missing', 'child'],
    response: 'To report a missing child:\n1. Click "Report Missing" from the sidebar\n2. Fill in child details (name, age, gender, last seen location)\n3. Add parent/guardian contact info\n4. Upload photos for AI matching\n5. Set priority level\n6. Submit the report',
  },
  {
    keywords: ['ai', 'match', 'facial', 'recognition', 'compare'],
    response: 'AI matching works by:\n1. Comparing uploaded photos using facial recognition\n2. Calculating similarity scores (0-100%)\n3. Confidence levels: High (>70%), Medium (40-70%), Low (<40%)\n4. Police/Admin can verify or reject matches\n5. Verified matches lead to reunification',
  },
  {
    keywords: ['add', 'user', 'create', 'admin'],
    response: 'To add a user:\n1. Go to User Management in sidebar\n2. Click "Add User" button\n3. Fill in name, email, password, phone, role\n4. Set account status (Active/Inactive)\n5. Click "Create User"',
  },
  {
    keywords: ['role', 'permission', 'access'],
    response: 'User roles:\n• Admin — Full system access, manage users, analytics\n• Police — Report missing, verify matches, manage cases\n• NGO — Report missing, coordinate with shelters\n• Rescue — Register found children, field operations\n• Parent/Guardian — Report missing, track case status',
  },
  {
    keywords: ['login', 'sign in', 'password', 'account'],
    response: 'Login help:\n• Use your registered email and password\n• Demo accounts: admin@reunifi.ai, police@reunifi.ai, ngo@reunifi.ai, parent@reunifi.ai\n• After 5 failed attempts, account locks for 15 minutes\n• Use "Forgot Password" to reset',
  },
  {
    keywords: ['notification', 'alert', 'bell'],
    response: 'Notifications alert you about:\n• New AI matches found\n• Case status updates\n• Role changes\n• Password resets\n• Emergency alerts\nCheck the bell icon in the header for updates.',
  },
  {
    keywords: ['dashboard', 'overview', 'home'],
    response: 'The dashboard shows:\n• Statistics cards (missing, found, matched, reunified)\n• Activity charts with trends\n• Recent match alerts\n• Activity timeline\n• Quick action buttons',
  },
  {
    keywords: ['upload', 'photo', 'image', 'picture'],
    response: 'To upload photos:\n1. Go to Report Missing or Register Found form\n2. Click the photo upload area\n3. Select images from your device\n4. Clear, front-facing photos work best for AI matching',
  },
  {
    keywords: ['case', 'track', 'investigation'],
    response: 'Case tracking:\n1. Go to Case Tracker from sidebar\n2. View all assigned and open cases\n3. Filter by status (open, investigating, matched, closed)\n4. Add notes and update case status\n5. Assign cases to officers (Admin/Police only)',
  },
  {
    keywords: ['found', 'register', 'rescue'],
    response: 'To register a found child:\n1. Click "Register Found" from sidebar\n2. Fill in estimated details (name, age, gender)\n3. Add found location and date\n4. Describe health status and ID marks\n5. Upload photos for AI matching\n6. Provide shelter/rescue details',
  },
  {
    keywords: ['delete', 'remove', 'user'],
    response: 'To delete a user (Admin only):\n1. Go to User Management\n2. Click the three-dot menu on a user row\n3. Select "Delete User"\n4. Confirm the deletion in the dialog\nNote: You cannot delete your own account.',
  },
  {
    keywords: ['help', 'what', 'how', 'can you'],
    response: 'I can help you with:\n• Reporting a missing child\n• How AI matching works\n• Adding users (Admin)\n• Role explanations\n• Login help\n• Notifications\n• Case tracking\n• Registering found children\n\nJust type your question!',
  },
  {
    keywords: ['confidence', 'score', 'threshold'],
    response: 'Match confidence levels:\n• High (>70%) — Strong facial similarity, likely a match\n• Medium (40-70%) — Moderate similarity, needs verification\n• Low (<40%) — Weak similarity, unlikely but worth reviewing\n\nAdmin can adjust the match threshold in Settings.',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good'],
    response: 'Hello! Welcome to Reunifi AI. I\'m here to help you navigate the platform, answer questions about features, and guide you through processes. What would you like to know?',
  },
  {
    keywords: ['thank', 'thanks', 'great', 'awesome'],
    response: 'You\'re welcome! If you have any more questions about Reunifi AI, feel free to ask. I\'m always here to help!',
  },
]

function getPredefinedResponse(message: string): string {
  const lowerMsg = message.toLowerCase()
  for (const item of PREDEFINED_RESPONSES) {
    if (item.keywords.some(kw => lowerMsg.includes(kw))) {
      return item.response
    }
  }
  return "I can help you with:\n• Reporting a missing child\n• How AI matching works\n• Adding users (Admin)\n• Role explanations\n• Login help\n• Notifications\n\nWhat would you like to know?"
}

// ─── Suggested Questions ─────────────────────────────────────────────
const SUGGESTED_QUESTIONS = [
  'How do I report a missing child?',
  'How does AI matching work?',
  'What are the user roles?',
  'How do I register a found child?',
  'How do I add a user?',
  'How do notifications work?',
]

// ─── Component ───────────────────────────────────────────────────────
export function AIChatbot() {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ─── Auto-scroll to bottom ──────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // ─── Focus input when opened ────────────────────────────────────
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen, isMinimized])

  // ─── Initialize welcome message ─────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "👋 Hello! I'm the Reunifi AI Assistant. I can help you with reporting missing children, understanding AI matching, navigating the dashboard, managing users, and more. How can I help you today?",
          timestamp: new Date(),
        },
      ])
    }
  }, [messages.length])

  // ─── Send Message (Predefined-only, NO AI model, NO API call) ──────
  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate brief typing delay for natural feel, then use predefined response
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400))

    const response = getPredefinedResponse(text)
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, assistantMessage])
    setIsLoading(false)
  }

  // ─── Clear Chat (local only, no API call) ──────────────────────
  const handleClearChat = () => {
    setSessionId('')
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "👋 Chat cleared! How can I help you today?",
        timestamp: new Date(),
      },
    ])
    toast({ title: 'Chat cleared', description: 'Conversation history has been reset' })
  }

  // ─── Handle key press ───────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* ─── Floating Chat Button ─────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 transition-all duration-300 group"
            aria-label="Open AI Assistant"
          >
            <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full animate-ping bg-cyan-400/30" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Chat Window ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl transition-all duration-300 ${
              isMinimized
                ? 'bottom-5 right-5 h-14 w-72'
                : 'bottom-5 right-5 h-[520px] w-[360px] max-h-[calc(100dvh-2.5rem)] sm:h-[560px] sm:w-[400px]'
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(8, 15, 30, 0.95), rgba(15, 25, 50, 0.92))',
            }}
          >
            {/* ─── Header ──────────────────────────────────────────── */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-white/10 cursor-pointer"
              onClick={() => isMinimized && setIsMinimized(false)}
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(20, 184, 166, 0.1))',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-400">
                    <Bot className="h-4.5 w-4.5 text-white" />
                  </div>
                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0f1925]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Reunifi AI Assistant</h3>
                  <p className="text-[10px] text-cyan-300/70">Always here to help</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={(e) => { e.stopPropagation(); handleClearChat() }}
                  title="Clear chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }}
                  title={isMinimized ? 'Maximize' : 'Minimize'}
                >
                  {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
                  title="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* ─── Neon glow border effect ─────────────────────────── */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

            {/* ─── Chat Content (hidden when minimized) ────────────── */}
            {!isMinimized && (
              <>
                {/* ─── Messages Area ──────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 min-h-0">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg ${
                        msg.role === 'assistant'
                          ? 'bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30'
                          : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <Bot className="h-3.5 w-3.5 text-cyan-400" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-indigo-400" />
                        )}
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          msg.role === 'assistant'
                            ? 'bg-white/[0.06] text-white/90 border border-white/[0.08] rounded-tl-sm'
                            : 'bg-gradient-to-br from-cyan-500/25 to-teal-500/20 text-white border border-cyan-500/20 rounded-tr-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2.5"
                    >
                      <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30">
                        <Bot className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* ─── Suggested Questions (show when few messages) ─── */}
                {messages.length <= 2 && !isLoading && (
                  <div className="px-4 pb-2">
                    <p className="text-[10px] text-cyan-400/50 mb-2 uppercase tracking-wider">Quick questions</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                        <button
                          key={q}
                          onClick={() => handleSend(q)}
                          className="text-[11px] px-2.5 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-300/80 hover:bg-cyan-500/15 hover:text-cyan-200 transition-all duration-200 truncate max-w-[160px]"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Input Area ────────────────────────────────────── */}
                <div className="p-3 border-t border-white/10" style={{ background: 'rgba(8, 15, 30, 0.5)' }}>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything about Reunifi AI..."
                      className="flex-1 h-9 bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 text-sm rounded-xl focus:border-cyan-500/40 focus:ring-cyan-500/20"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => handleSend()}
                      disabled={isLoading || !input.trim()}
                      size="icon"
                      className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shrink-0 disabled:opacity-30"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-[9px] text-white/20 mt-1.5 text-center">Reunifi AI Assistant • Quick Help</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
