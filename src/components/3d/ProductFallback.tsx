"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface ProductFallbackProps {
  imagePath: string;
  className?: string;
  priority?: boolean;
}

export function ProductFallback({
  imagePath,
  className,
  priority = false,
}: ProductFallbackProps) {
  const isRemoteImage = /^https?:\/\//.test(imagePath);

  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className={`relative ${className}`}
    >
      {isRemoteImage ? (
        <img
          src={imagePath}
          alt="Product"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className="h-auto w-full drop-shadow-2xl mask-radial"
        />
      ) : (
        <Image
          src={imagePath}
          alt="Product"
          width={800}
          height={1000}
          priority={priority}
          fetchPriority={priority ? "high" : "auto"}
          className="w-full h-auto drop-shadow-2xl mask-radial"
        />
      )}
    </motion.div>
  );
}
