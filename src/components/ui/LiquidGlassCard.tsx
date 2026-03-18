'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useUI } from '@/components/providers/UIProvider'

/**
 * Props for the LiquidGlassCard component
 * @interface LiquidGlassCardProps
 */
interface LiquidGlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'clear' | 'tinted'
  intensity?: 'subtle' | 'medium' | 'strong'
  interactive?: boolean
}

/**
 * LiquidGlassCard - Premium glass morphism component with dynamic effects
 * 
 * Features:
 * - Mouse-responsive lighting effects
 * - Scroll-based blur intensity changes
 * - Hardware-accelerated performance optimizations
 * - Mobile-optimized backdrop filters
 * - Intersection Observer for visibility-based rendering
 * 
 * Performance:
 * - Uses global UI provider to prevent duplicate event listeners
 * - SVG filters only render when card is visible
 * - 60fps throttled updates for smooth animations
 * - Mobile-specific optimizations for iOS/Android
 */
export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className,
  variant = 'default',
  intensity = 'medium',
  interactive = true
}) => {
  /**
   * Generate unique ID for this card instance
   * Used for global state management and visibility tracking
   */
  const cardId = useRef(`liquid-glass-${Math.random().toString(36).substr(2, 9)}`)
  
  /**
   * Connect to global performance manager from UI provider
   * This ensures single event listeners for all liquid glass cards
   */
  const { 
    registerLiquidGlassCard 
  } = useUI()
  
  const { 
    cardRef, 
    getCSSVariables, 
    getBlurClass, 
    isVisible 
  } = registerLiquidGlassCard(cardId.current, interactive)

  const variantStyles = {
    default: 'liquid-glass',
    clear: 'liquid-glass-clear',
    tinted: 'liquid-glass-tinted'
  }

  const intensityStyles = {
    subtle: 'liquid-glass-subtle',
    medium: 'liquid-glass-medium',
    strong: 'liquid-glass-strong'
  }

  return (
    <>
      {/* SVG Filter for Liquid Distortion - only render if visible */}
      {isVisible && (
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id="liquid-distortion">
            <feTurbulence 
              baseFrequency="0.02" 
              numOctaves="3" 
              result="turbulence"
              seed={interactive ? 0 : 0}
            >
              <animate 
                attributeName="baseFrequency" 
                values="0.02;0.025;0.02" 
                dur="8s" 
                repeatCount="indefinite" 
              />
            </feTurbulence>
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="turbulence" 
              scale="3" 
              xChannelSelector="R" 
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="0.5" />
            <feColorMatrix 
              values="1 0 0 0 0
                      0 1 0 0 0  
                      0 0 1 0 0
                      0 0 0 0.95 0" 
            />
          </filter>
        </svg>
      )}

      <motion.div
        ref={cardRef}
        className={cn(
          variantStyles[variant],
          intensityStyles[intensity],
          getBlurClass(),
          'group relative overflow-hidden',
          className
        )}
        style={getCSSVariables() as any}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={interactive ? {
          scale: 1.005,
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        } : undefined}
      >
        {/* Iridescent overlay for soap bubble effect - only render if visible */}
        {isVisible && <div className="iridescent-overlay" />}
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {children}
        </div>
      </motion.div>
    </>
  )
}

export default LiquidGlassCard
