'use client'

import { motion } from 'framer-motion'
import { Brain, Sparkles } from 'lucide-react'

interface AILoadingProps {
  message?: string
  submessage?: string
  size?: 'sm' | 'md' | 'lg'
}

export function AILoadingAnimation({
  message = 'AI Processing',
  submessage = 'Analyzing data patterns...',
  size = 'md',
}: AILoadingProps) {
  const sizeConfig = {
    sm: { container: 'h-16 w-16', icon: 'h-6 w-6', text: 'text-sm', sub: 'text-xs' },
    md: { container: 'h-24 w-24', icon: 'h-8 w-8', text: 'text-base', sub: 'text-xs' },
    lg: { container: 'h-32 w-32', icon: 'h-10 w-10', text: 'text-lg', sub: 'text-sm' },
  }

  const config = sizeConfig[size]

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      {/* Animated Brain Icon */}
      <div className="relative">
        <motion.div
          className={`${config.container} rounded-full bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 flex items-center justify-center`}
          animate={{
            scale: [1, 1.05, 1],
            borderColor: ['rgba(34,211,238,0.2)', 'rgba(34,211,238,0.4)', 'rgba(34,211,238,0.2)'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Brain className={`${config.icon} text-cyan-500`} />
        </motion.div>

        {/* Orbiting Sparkles */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="absolute -top-1 left-1/2 -translate-x-1/2 h-3 w-3 text-teal-400" />
        </motion.div>
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2.5 w-2.5 text-cyan-400" />
        </motion.div>

        {/* Pulse rings */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
          animate={{
            scale: [1, 1.5],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-teal-400/20"
          animate={{
            scale: [1, 1.8],
            opacity: [0.3, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
            delay: 0.5,
          }}
        />
      </div>

      {/* Text */}
      <div className="text-center">
        <motion.p
          className={`${config.text} font-semibold text-foreground`}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {message}
        </motion.p>
        <motion.p
          className={`${config.sub} text-muted-foreground mt-1`}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {submessage}
        </motion.p>
      </div>

      {/* Animated dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-cyan-500"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  )
}
