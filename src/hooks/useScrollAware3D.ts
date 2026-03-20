"use client";

import { useState, useEffect, useCallback } from "react";

interface ScrollAware3DOptions {
  sectionIds: string[];
  threshold?: number; // 0 to 1, how much of section is visible
}

// Global singleton to prevent multiple Intersection Observer instances
let globalObserver: IntersectionObserver | null = null;
let globalCallbacks: Array<(activeSection: string | null) => void> = [];

export function useScrollAware3D({ sectionIds, threshold = 0.15 }: ScrollAware3DOptions) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    // Add this component's callback to the global list
    globalCallbacks.push(setActiveSection);
    
    // If observer already exists, just use it
    if (globalObserver) {
      return;
    }

    // Create the singleton observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Notify all subscribed components
            globalCallbacks.forEach(callback => callback(entry.target.id));
          }
        });
      },
      {
        threshold: threshold,
        rootMargin: "-5% 0px -5% 0px",
      }
    );

    globalObserver = observer;

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
          observer.observe(el);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      // Remove this component's callback
      globalCallbacks = globalCallbacks.filter(cb => cb !== setActiveSection);
      
      // Only disconnect if no more callbacks
      if (globalCallbacks.length === 0 && globalObserver) {
        globalObserver.disconnect();
        globalObserver = null;
      }
    };
  }, [sectionIds, threshold]);

  const isScrollingIntoSection = useCallback(
    (id: string) => activeSection === id,
    [activeSection]
  );

  const isScrollingOutOfSection = useCallback(
    (id: string) => activeSection !== id,
    [activeSection]
  );

  return {
    activeSection,
    isScrollingIntoSection,
    isScrollingOutOfSection,
  };
}
