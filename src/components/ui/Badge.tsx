"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "accent" | "muted";
  size?: "sm" | "md" | "lg";
  withDot?: boolean;
  animated?: boolean;
}

export function Badge({ 
  children, 
  className, 
  variant = "default",
  size = "sm",
  withDot = false,
  animated = false
}: BadgeProps) {
  const variants = {
    default: "text-label",
    accent: "text-accent", 
    muted: "text-secondary-label opacity-60"
  };

  const sizes = {
    sm: "text-[10px]",
    md: "text-[11px]", 
    lg: "text-[12px]"
  };

  const Component = animated ? motion.span : "span";

  return (
    <Component
      className={cn(
        "inline-block font-bold uppercase tracking-[0.25em]",
        variants[variant],
        sizes[size],
        className
      )}
      {...(animated && {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: 0.1 }
      })}
    >
      {withDot && (
        <>
          <div className="inline-flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-current" />
            <span>{children}</span>
          </div>
        </>
      )}
      {!withDot && children}
    </Component>
  );
}

interface BadgeListProps {
  items: string[];
  className?: string;
  variant?: "default" | "accent" | "muted";
  animated?: boolean;
}

export function BadgeList({ 
  items, 
  className, 
  variant = "muted",
  animated = false
}: BadgeListProps) {
  const Component = animated ? motion.div : "div";

  return (
    <Component
      className={cn(
        "flex flex-wrap items-center justify-center gap-6",
        className
      )}
      {...(animated && {
        initial: "hidden",
        animate: "visible",
        variants: {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }
      })}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 bg-system-fill backdrop-blur-sm px-3 py-1 squircle">
          <div className="w-1 h-1 rounded-full bg-accent" />
          <span className="text-[10px] tracking-[0.25em] text-secondary-label uppercase opacity-60">
            {item}
          </span>
        </div>
      ))}
    </Component>
  );
}
