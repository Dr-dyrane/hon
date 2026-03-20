"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MarketingSnapshot } from "@/lib/marketing/snapshot";

const MarketingContentContext = createContext<MarketingSnapshot | undefined>(
  undefined
);

export function MarketingContentProvider({
  snapshot,
  children,
}: {
  snapshot: MarketingSnapshot;
  children: ReactNode;
}) {
  return (
    <MarketingContentContext.Provider value={snapshot}>
      {children}
    </MarketingContentContext.Provider>
  );
}

export function useMarketingContent() {
  const context = useContext(MarketingContentContext);

  if (!context) {
    throw new Error(
      "useMarketingContent must be used within MarketingContentProvider"
    );
  }

  return context;
}
