"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeroEyebrowProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  position?: "center" | "left" | "right";
}

export function HeroEyebrow({ 
  children, 
  className,
  animated = false,
  position = "center"
}: HeroEyebrowProps) {
  const positions = {
    center: "justify-center",
    left: "lg:justify-start justify-center", 
    right: "lg:justify-end justify-center"
  };

  const Component = animated ? motion.div : "div";

  return (
    <Component
      className={cn(
        "flex",
        positions[position],
        "mb-8"
      )}
      {...(animated && {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, delay: 0.2 }
      })}
    >
      <span className={cn("hero-eyebrow", className)}>
        {children}
      </span>
    </Component>
  );
}
