"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ScrollAwareOptions {
  sectionIds: string[];
  onSectionChange?: (sectionId: string) => void;
}

export function useScrollAware3D({ sectionIds, onSectionChange }: ScrollAwareOptions) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("down");
  const lastScrollY = useRef(0);
  const tickingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const checkActiveSection = useCallback(() => {
    const viewportHeight = window.innerHeight;
    const currentScrollY = window.scrollY;
    const viewportCenter = currentScrollY + viewportHeight / 2;

    let currentSection = "";
    let maxVisibility = 0;

    sectionIds.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + currentScrollY;
        const elementBottom = rect.bottom + currentScrollY;
        const elementHeight = elementBottom - elementTop;

        // Calculate how much of the element is visible in the viewport center
        const visibleTop = Math.max(elementTop, currentScrollY);
        const visibleBottom = Math.min(elementBottom, currentScrollY + viewportHeight);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        
        // Bonus for elements that contain the viewport center
        const centerBonus = viewportCenter >= elementTop && viewportCenter <= elementBottom ? 0.5 : 0;
        
        const visibility = (visibleHeight / elementHeight) + centerBonus;

        if (visibility > maxVisibility) {
          maxVisibility = visibility;
          currentSection = sectionId;
        }
      }
    });

    return currentSection;
  }, [sectionIds]);

  const handleScroll = useCallback(() => {
    if (tickingRef.current) return;
    tickingRef.current = true;

    const currentScrollY = window.scrollY;
    const direction = currentScrollY > lastScrollY.current ? "down" : "up";
    setScrollDirection(direction);
    lastScrollY.current = currentScrollY;

    // Debounce section changes to reduce updates
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const currentSection = checkActiveSection();
      if (currentSection && currentSection !== activeSection) {
        setActiveSection(currentSection);
        onSectionChange?.(currentSection);
      }
      tickingRef.current = false;
      debounceTimerRef.current = null;
    }, 100); // 100ms debounce
  }, [checkActiveSection, activeSection, onSectionChange]);

  useEffect(() => {
    // Initial check
    const initialSection = checkActiveSection();
    if (initialSection) {
      setActiveSection(initialSection);
    }

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [handleScroll, checkActiveSection]);

  return {
    activeSection,
    scrollDirection,
    isInSection: (sectionId: string) => activeSection === sectionId,
    isScrollingIntoSection: (sectionId: string) => {
      return activeSection === sectionId && scrollDirection === "down";
    },
    isScrollingOutOfSection: (sectionId: string) => {
      return activeSection === sectionId && scrollDirection === "up";
    },
  };
}
