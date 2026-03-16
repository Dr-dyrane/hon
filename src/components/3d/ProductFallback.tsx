"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface ProductFallbackProps {
  imagePath: string;
  className?: string;
  onClick?: () => void;
}

export function ProductFallback({ imagePath, className, onClick }: ProductFallbackProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`relative cursor-pointer ${className}`}
      onClick={onClick}
    >
      <Image
        src={imagePath}
        alt="Product"
        width={800}
        height={1000}
        priority
        className="w-full h-auto drop-shadow-2xl animate-float-slow mask-radial"
      />
      
      {/* Floating elements to enhance 3D feel */}
      <motion.div 
        animate={{ y: [0, -20, 0], x: [0, 10, 0], rotate: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-12 -right-12 w-24 h-24 bg-accent/10 rounded-full blur-2xl pointer-events-none"
      />
      <motion.div 
        animate={{ y: [0, 30, 0], x: [0, -15, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-16 -left-16 w-32 h-32 bg-forest/5 rounded-full blur-3xl pointer-events-none"
      />

      {/* Click indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/20 backdrop-blur-sm px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest pointer-events-none whitespace-nowrap">
        Click to Toggle
      </div>
    </motion.div>
  );
}
