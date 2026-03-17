"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isScrollNavCollapsed: boolean;
  setIsScrollNavCollapsed: (collapsed: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrollNavCollapsed, setIsScrollNavCollapsed] = useState(false);

  return (
    <UIContext.Provider value={{
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      isScrollNavCollapsed,
      setIsScrollNavCollapsed
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
