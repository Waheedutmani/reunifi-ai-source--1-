'use client'

import { memo } from 'react'

// ─── Neural Network Lines ──────────────────────────────────────────
// SVG paths that animate with stroke-dasharray to simulate neural connections
const NeuralNetworkLines = memo(function NeuralNetworkLines() {
  return (
    <svg
      className="ai-bg-neural"
      viewBox="0 0 800 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Neural connection lines */}
      <path
        d="M50,300 Q200,100 400,200 T750,150"
        className="ai-neural-line ai-neural-line-1"
      />
      <path
        d="M0,400 Q150,250 350,350 T700,300 T800,250"
        className="ai-neural-line ai-neural-line-2"
      />
      <path
        d="M100,500 Q300,300 500,400 T800,350"
        className="ai-neural-line ai-neural-line-3"
      />
      <path
        d="M0,200 Q250,50 400,150 T700,100"
        className="ai-neural-line ai-neural-line-4"
      />
      <path
        d="M50,550 Q200,400 350,500 T650,450 T800,500"
        className="ai-neural-line ai-neural-line-5"
      />

      {/* Neural nodes (small circles at intersections) */}
      <circle cx="200" cy="100" r="2" className="ai-neural-node ai-neural-node-1" />
      <circle cx="400" cy="200" r="2.5" className="ai-neural-node ai-neural-node-2" />
      <circle cx="350" cy="350" r="2" className="ai-neural-node ai-neural-node-3" />
      <circle cx="500" cy="400" r="2" className="ai-neural-node ai-neural-node-4" />
      <circle cx="150" cy="250" r="1.5" className="ai-neural-node ai-neural-node-5" />
      <circle cx="650" cy="450" r="2" className="ai-neural-node ai-neural-node-6" />
      <circle cx="700" cy="100" r="1.5" className="ai-neural-node ai-neural-node-7" />
      <circle cx="300" cy="300" r="2" className="ai-neural-node ai-neural-node-8" />
    </svg>
  )
})

// ─── Floating Particles ────────────────────────────────────────────
// CSS-only particles that float upward — reduced count for performance
const PARTICLES = [
  { x: '8%', delay: '0s', duration: '18s', size: '3px' },
  { x: '20%', delay: '4s', duration: '22s', size: '2px' },
  { x: '35%', delay: '2s', duration: '25s', size: '2px' },
  { x: '55%', delay: '1s', duration: '23s', size: '2px' },
  { x: '70%', delay: '3s', duration: '24s', size: '2px' },
  { x: '88%', delay: '5s', duration: '22s', size: '2px' },
] as const

const FloatingParticles = memo(function FloatingParticles() {
  return (
    <div className="ai-bg-particles" aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="ai-particle"
          style={{
            left: p.x,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  )
})

// ─── Grid Motion ───────────────────────────────────────────────────
// Subtle moving grid pattern
const GridMotion = memo(function GridMotion() {
  return (
    <div className="ai-bg-grid" aria-hidden="true">
      <div className="ai-grid-inner" />
    </div>
  )
})

// ─── AI Scanning Glow ──────────────────────────────────────────────
// Horizontal scanning line that sweeps vertically
const AIScanGlow = memo(function AIScanGlow() {
  return (
    <div className="ai-bg-scan" aria-hidden="true">
      <div className="ai-scan-line" />
    </div>
  )
})

// ─── Smooth Moving Gradients ───────────────────────────────────────
// Animated gradient orbs
const MovingGradients = memo(function MovingGradients() {
  return (
    <div className="ai-bg-gradients" aria-hidden="true">
      <div className="ai-gradient-orb ai-gradient-orb-1" />
      <div className="ai-gradient-orb ai-gradient-orb-2" />
      <div className="ai-gradient-orb ai-gradient-orb-3" />
    </div>
  )
})

// ─── Main Component ────────────────────────────────────────────────
// Uses CSS-based dark mode detection (via .dark class on <html>)
// and CSS @media (prefers-reduced-motion) for accessibility.
// Memoized to prevent unnecessary re-renders.
// Reduced particles from 12 to 6 for performance.
export const AIBackgroundEffects = memo(function AIBackgroundEffects() {
  return (
    <div className="ai-bg-container" aria-hidden="true">
      {/* Layer 1: Moving gradients (deepest) */}
      <MovingGradients />

      {/* Layer 2: Grid pattern */}
      <GridMotion />

      {/* Layer 3: Neural network lines */}
      <NeuralNetworkLines />

      {/* Layer 4: Floating particles — reduced count */}
      <FloatingParticles />

      {/* Layer 5: AI scanning glow (top-most) */}
      <AIScanGlow />
    </div>
  )
})
