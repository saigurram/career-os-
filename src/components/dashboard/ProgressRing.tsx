'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ProgressRingProps {
  value: number // 0–100
  size?: number
  strokeWidth?: number
}

export function ProgressRing({ value, size = 160, strokeWidth = 12 }: ProgressRingProps) {
  const [animated, setAnimated] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  const offset = circumference - (animated / 100) * circumference
  const gradientId = 'ring-gradient'

  return (
    <div data-testid="progress-ring" className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.60 0.22 264)" />
            <stop offset="50%" stopColor="oklch(0.55 0.22 285)" />
            <stop offset="100%" stopColor="oklch(0.55 0.22 300)" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="oklch(1 0 0 / 6%)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 8px oklch(0.60 0.22 264 / 60%))' }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {value}%
        </motion.span>
        <span className="text-xs text-muted-foreground">complete</span>
      </div>
    </div>
  )
}
