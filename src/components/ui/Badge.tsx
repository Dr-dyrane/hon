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
    muted: "text-secondary-label"
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
  const tone =
    variant === "accent"
      ? {
          container: "bg-accent/10",
          dot: "bg-accent",
          text: "text-accent/80",
        }
      : variant === "default"
        ? {
            container: "bg-system-fill",
            dot: "bg-label",
            text: "text-label/70",
          }
        : {
            container: "bg-system-fill",
            dot: "bg-accent",
            text: "text-label",
          };

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
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 backdrop-blur-sm px-3 py-1 squircle",
            tone.container
          )}
        >
          <div className={cn("w-1 h-1 rounded-full", tone.dot)} />
          <span className={cn("text-[10px] tracking-[0.25em] uppercase", tone.text)}>
            {item}
          </span>
        </div>
      ))}
    </Component>
  );
}
