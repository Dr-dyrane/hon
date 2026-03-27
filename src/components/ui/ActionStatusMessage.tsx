"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ActionStatusMessage({
  tone,
  children,
  className,
}: {
  tone: "error" | "info" | "success";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={cn(
        "rounded-[24px] px-4 py-3 text-sm leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
        tone === "error" &&
          "bg-[rgba(185,28,28,0.08)] text-label dark:bg-[rgba(248,113,113,0.14)]",
        tone === "success" && "bg-accent/10 text-label dark:bg-accent/18",
        tone === "info" && "bg-system-fill/72 text-secondary-label",
        className
      )}
    >
      {children}
    </div>
  );
}
