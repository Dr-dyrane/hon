"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';

/**
 * Global state for liquid glass effects across all components
 * Centralized for performance - single event listeners instead of per-card
 */
interface GlobalLiquidGlassState {
  mousePosition: { x: number; y: number };
  scrollVelocity: number;
  isScrolling: boolean;
  visibleCards: Set<string>;
  performanceMode: boolean;
}

/**
 * Main UI context interface combining navigation and liquid glass management
 */
interface UIContextType {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isScrollNavCollapsed: boolean;
  setIsScrollNavCollapsed: (collapsed: boolean) => void;
  /**
   * Registers a liquid glass card for global performance management
   * @param cardId - Unique identifier for the card
   * @param interactive - Whether the card responds to mouse movement
   * @returns Card management functions and state
   */
  registerLiquidGlassCard: (cardId: string, interactive: boolean) => {
    cardRef: React.RefObject<HTMLDivElement | null>;
    getCSSVariables: () => Record<string, string>;
    getBlurClass: () => string;
    isVisible: boolean;
  };
  liquidGlassState: GlobalLiquidGlassState;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

/**
 * Global liquid glass state singleton
 * Shared across all components for performance optimization
 * Prevents duplicate event listeners and state management
 */
let globalLiquidGlassState: GlobalLiquidGlassState = {
  mousePosition: { x: 50, y: 50 },
  scrollVelocity: 0,
  isScrolling: false,
  visibleCards: new Set(),
  performanceMode: false
};

/**
 * Performance optimization: single set of listeners for all liquid glass cards
 * Reduces memory usage and improves performance on mobile/iOS
 */
let liquidGlassListeners: Set<(state: GlobalLiquidGlassState) => void> = new Set();
let liquidGlassRafId: number | null = null;
let lastScrollY = 0;
let scrollTimeout: NodeJS.Timeout | null = null;

export function UIProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrollNavCollapsed, setIsScrollNavCollapsed] = useState(true);
  const [liquidGlassState, setLiquidGlassState] = useState(globalLiquidGlassState);
  const cardRefs = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());

  /**
   * Performance-optimized global liquid glass manager
   * Uses single event listeners and RAF throttling for 60fps performance
   * Centralized card visibility tracking to prevent duplicate IntersectionObservers
   */
  const registerLiquidGlassCard = useCallback((cardId: string, interactive: boolean = true) => {
    // Create or get existing ref for this card instance
    if (!cardRefs.current.has(cardId)) {
      cardRefs.current.set(cardId, React.createRef<HTMLDivElement | null>());
    }
    const cardRef = cardRefs.current.get(cardId)!;

    /**
     * Throttled update function (60fps)
     * Prevents excessive re-renders during rapid mouse/scroll events
     */
    const throttledUpdate = useCallback(() => {
      setLiquidGlassState({ ...globalLiquidGlassState });
    }, []);

    // Register card for visibility tracking
    const registerCard = useCallback(() => {
      if (!cardRef.current) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              globalLiquidGlassState.visibleCards.add(cardId);
            } else {
              globalLiquidGlassState.visibleCards.delete(cardId);
            }
          });
          throttledUpdate();
        },
        { threshold: 0.1 }
      );

      observer.observe(cardRef.current);
      return () => observer.disconnect();
    }, [cardId, throttledUpdate]);

    // Register for visibility tracking
    useEffect(() => {
      const cleanup = registerCard();
      return cleanup;
    }, [registerCard]);

    // Get CSS variables for this card
    const getCSSVariables = useCallback(() => {
      if (!interactive || !globalLiquidGlassState.visibleCards.has(cardId)) {
        return {
          '--mouse-x': '50%',
          '--mouse-y': '50%'
        } as Record<string, string>;
      }
      return {
        '--mouse-x': `${globalLiquidGlassState.mousePosition.x}%`,
        '--mouse-y': `${globalLiquidGlassState.mousePosition.y}%`
      } as Record<string, string>;
    }, [cardId, interactive]);

    // Get blur class based on scroll velocity
    const getBlurClass = useCallback(() => {
      if (!globalLiquidGlassState.visibleCards.has(cardId)) return '';
      if (globalLiquidGlassState.scrollVelocity > 20) return 'scrolling-fast';
      if (globalLiquidGlassState.scrollVelocity > 5) return 'scrolling-slow';
      return '';
    }, [cardId]);

    const isVisible = globalLiquidGlassState.visibleCards.has(cardId);

    return {
      cardRef,
      getCSSVariables,
      getBlurClass,
      isVisible
    };
  }, []);

  // Global event listeners for liquid glass
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      globalLiquidGlassState.mousePosition = {
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      };
      
      if (!liquidGlassRafId) {
        liquidGlassRafId = requestAnimationFrame(() => {
          setLiquidGlassState({ ...globalLiquidGlassState });
          liquidGlassRafId = null;
        });
      }
    };

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      globalLiquidGlassState.scrollVelocity = Math.abs(currentScrollY - lastScrollY);
      globalLiquidGlassState.isScrolling = true;
      lastScrollY = currentScrollY;

      if (!liquidGlassRafId) {
        liquidGlassRafId = requestAnimationFrame(() => {
          setLiquidGlassState({ ...globalLiquidGlassState });
          liquidGlassRafId = null;
        });
      }

      // Clear existing timeout
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      // Set new timeout to detect when scrolling stops
      scrollTimeout = setTimeout(() => {
        globalLiquidGlassState.scrollVelocity = 0;
        globalLiquidGlassState.isScrolling = false;
        setLiquidGlassState({ ...globalLiquidGlassState });
        liquidGlassRafId = null;
      }, 150);
    };

    // Single global event listeners
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      if (liquidGlassRafId) cancelAnimationFrame(liquidGlassRafId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <UIContext.Provider value={{
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      isScrollNavCollapsed,
      setIsScrollNavCollapsed,
      registerLiquidGlassCard,
      liquidGlassState
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
