"use client";

import { useEffect } from "react";

export function ThreeJSSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalWarn = console.warn;
      console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('THREE.THREE.Clock: This module has been deprecated')) {
          return; // Suppress this specific warning
        }
        originalWarn(...args);
      };
      
      return () => {
        console.warn = originalWarn;
      };
    }
  }, []);

  return null;
}
