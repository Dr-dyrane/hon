"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { useTheme } from "next-themes";
import { PRODUCTS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Product3DViewer } from "@/components/3d/Product3DViewer";
import { useScrollAware3D } from "@/hooks/useScrollAware3D";

// Apple-style word reveal component
function WordReveal({ 
  text, 
  className = "", 
  delay = 0,
  staggerDelay = 0.08 
}: { 
  text: string; 
  className?: string; 
  delay?: number;
  staggerDelay?: number;
}) {
  const words = text.split(" ");
  
  return (
    <span className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.8,
              delay: delay + (i * staggerDelay),
              ease: [0.22, 1, 0.36, 1],
            }}
            className="inline-block"
          >
            {word}
            {i < words.length - 1 && "\u00A0"}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

// Floating indicator dots
function FloatingDots() {
  return (
    <div className="flex items-center gap-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.8 + i * 0.1, duration: 0.4 }}
          className="w-1.5 h-1.5 rounded-full bg-accent/40"
        />
      ))}
    </div>
  );
}

export function HeroSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<keyof typeof PRODUCTS>("protein_chocolate");
  const sectionRef = useRef<HTMLElement>(null);

  // Scroll-based parallax
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  const productY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const productScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.3], [0, -40]);

  // Scroll-aware 3D animation
  const { isScrollingIntoSection } = useScrollAware3D({
    sectionIds: ["hero", "solution", "shop"],
  });

  const toggleProduct = () => {
    setCurrentProduct(prev => prev === "protein_chocolate" ? "soy_powder" : "protein_chocolate");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const productData: Record<string, { model: string; glowColor: string }> = {
    protein_chocolate: {
      model: "/models/products/protein_chocolate.glb",
      glowColor: "rgba(74, 44, 42, 0.15)",
    },
    soy_powder: {
      model: "/models/products/soy_powder.glb",
      glowColor: "rgba(15, 61, 46, 0.12)",
    }
  };

  return (
    <section 
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background"
    >
      {/* Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="hero-grain-layer" />
        
        {/* Primary ambient glow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <div 
            className="absolute top-0 right-0 w-[70vw] h-[70vw] rounded-full blur-[150px] opacity-30 animate-pulse-glow"
            style={{ background: `radial-gradient(circle, ${productData[currentProduct].glowColor} 0%, transparent 70%)` }}
          />
          <div 
            className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full blur-[120px] opacity-20"
            style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
          />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="container-shell relative z-10 grid items-center gap-16 lg:gap-8 lg:grid-cols-2 min-h-[calc(100svh-160px)] py-32 lg:py-0">
        
        {/* Text Content */}
        <motion.div 
          style={{ opacity: textOpacity, y: textY }}
          className="max-w-2xl text-center lg:text-left pt-16 lg:pt-0 mx-auto lg:mx-0 order-2 lg:order-1"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-start mb-10"
          >
            <span className="hero-eyebrow">
              <Image
                src="/images/hero/hop-mark.svg"
                alt=""
                width={14}
                height={14}
                className="dark:invert"
              />
              Plant-Based Performance
            </span>
          </motion.div>

          {/* Main Headline - Word by word reveal */}
          <h1 className="font-headline text-display text-foreground">
            <WordReveal 
              text="Clean" 
              delay={0.4}
              className="block"
            />
            <WordReveal 
              text="Plant Protein." 
              delay={0.6}
              className="block"
            />
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 text-body-lg text-muted max-w-md mx-auto lg:mx-0"
          >
            Engineered for elite performance. Zero fillers, zero compromises. 
            Pure fuel for the modern athlete.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 flex flex-wrap gap-4 justify-center lg:justify-start"
          >
            <Button
              size="lg"
              variant="primary"
              className="px-10 min-h-[56px]"
              onClick={() => {
                const el = document.getElementById("shop");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Start Your Order
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="px-10 min-h-[56px]"
              onClick={() => {
                const el = document.getElementById("ingredients");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Ingredients
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="mt-16 flex flex-wrap items-center justify-center lg:justify-start gap-8 text-[11px] font-semibold tracking-[0.1em] text-muted/60 uppercase"
          >
            {["Plant-Based", "Clean Ingredients", "Easy Digestion"].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-2"
              >
                <div className="w-1 h-1 rounded-full bg-accent" />
                <span>{item}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Product Showcase */}
        <div className="relative flex flex-col items-center justify-center h-full min-h-[400px] lg:min-h-[600px] order-1 lg:order-2">
          <motion.div 
            style={{ y: productY, scale: productScale }}
            className="relative w-full max-w-[400px] lg:max-w-[480px] aspect-square flex items-center justify-center"
          >
            {/* Ambient product glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-[80%] h-[80%] rounded-full blur-[80px]"
                style={{ background: productData[currentProduct].glowColor }}
              />
            </div>

            {/* Product 3D Viewer */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProduct}
                initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 1.05, rotateY: 15 }}
                transition={{ 
                  duration: 0.8, 
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="relative z-10 w-full h-full cursor-pointer perspective-2000"
                onClick={toggleProduct}
              >
                <Product3DViewer
                  modelPath={productData[currentProduct].model}
                  theme={isDark ? "dark" : "light"}
                  className="w-full h-full"
                  sectionId="hero"
                  scrollActive={isScrollingIntoSection("hero")}
                />
              </motion.div>
            </AnimatePresence>

            {/* Ground shadow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-8">
              <div className={cn(
                "w-full h-full rounded-full blur-[30px]",
                isDark ? "bg-black/40" : "bg-black/15"
              )} />
            </div>
          </motion.div>

          {/* Product Toggle Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="flex items-center gap-2 mt-8 p-1.5 rounded-full glass-morphism shadow-soft"
          >
            {(["protein_chocolate", "soy_powder"] as const).map((prodKey) => (
              <button
                key={prodKey}
                onClick={() => setCurrentProduct(prodKey)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-500",
                  currentProduct === prodKey
                    ? "bg-foreground text-background shadow-lg"
                    : "text-muted hover:text-foreground"
                )}
              >
                {PRODUCTS[prodKey].name.split(" ").pop()}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.8 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] font-semibold tracking-[0.2em] text-muted/40 uppercase">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-border-soft flex items-start justify-center p-1.5"
        >
          <motion.div 
            className="w-1 h-2 rounded-full bg-muted/40"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
