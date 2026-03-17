"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { BadgeList } from "@/components/ui/Badge";
import Image from "next/image";
import { useTheme } from "next-themes";
import { PRODUCTS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Product3DViewer } from "@/components/3d/Product3DViewer";
import AOS from "aos";

export function HeroSection({ 
  activeSection, 
  isScrollingIntoSection, 
  isScrollingOutOfSection 
}: {
  activeSection: string | null;
  isScrollingIntoSection: (sectionId: string) => boolean;
  isScrollingOutOfSection: (sectionId: string) => boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<keyof typeof PRODUCTS>("protein_chocolate");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Refresh AOS to calculate correct scroll positions for the 3D viewer
  useEffect(() => {
    console.log(`🔄 [Hero] Product changed to: ${currentProduct}, refreshing AOS`);
    AOS.refresh();
  }, [currentProduct]);

  const isDark = mounted && resolvedTheme === "dark";

  const productData: any = {
    protein_chocolate: {
      model: "/models/products/protein_chocolate.glb",
      bgGlow: "bg-[#4A2C2A]/20",
      accent: "text-[#D7C5A3]",
    },
    soy_powder: {
      model: "/models/products/soy_powder.glb",
      bgGlow: "bg-accent/10",
      accent: "text-accent",
    }
  };

  const revealVariants: any = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2 + i * 0.1,
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  return (
    <section id="hero" className="hero-shell relative flex flex-col items-center justify-center overflow-hidden bg-background">
      {/* Atmosphere Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="hero-grain-layer" />

        {/* Dynamic Glow based on flavor */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentProduct + (isDark ? "-dark" : "-light")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <div className={cn(
              "absolute inset-0 blur-[120px] opacity-30 transition-colors duration-1000",
              currentProduct === "protein_chocolate" ? "bg-[#4A2C2A]/20" : "bg-accent/10"
            )} />

            {/* Custom glows for depth */}
            <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-forest/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-beige/10 rounded-full blur-[150px]" />
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={revealVariants}
        className="flex justify-center lg:justify-start mb-8"
      >
        <span className="hero-eyebrow">
          <Image
            src="/images/hero/hop-mark.svg"
            alt=""
            width={14}
            height={14}
            className="mr-2 dark:invert"
          />
          Plant-Based Performance
        </span>
      </motion.div>

      <div className="container-shell relative z-10 grid items-center gap-12 lg:grid-cols-2 min-h-[calc(100svh-120px)] py-0">
        {/* Copy Layer */}
        <div className="max-w-xl text-center lg:text-left pt-6 lg:pt-0 mx-auto lg:mx-0">
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            className="font-headline text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.92] tracking-[-0.03em] text-foreground"
          >
            Natural Energy
            <span className="block mt-4 sm:mt-6 text-muted italic">Made for Performance</span>
          </motion.h1>

          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={revealVariants}
            className="mt-16 flex flex-wrap gap-3 justify-center lg:justify-start"
          >
            <Button
              size="lg"
              variant="primary"
              className="px-10"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const el = document.getElementById("shop");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Start Your Order
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="px-10"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                const el = document.getElementById("ingredients");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              View Ingredients
            </Button>
          </motion.div>

          <BadgeList 
            items={["Plant-Based", "Clean Ingredients", "Easy Digestion"]}
            className="mt-16"
            animated
          />
        </div>

        {/* Product Layer */}
        <div className="relative flex flex-col items-center justify-center h-auto min-h-[450px] lg:min-h-[550px]">
          <div className="relative w-full max-w-[440px] lg:max-w-[500px] aspect-square flex items-center justify-center">
            {/* Ambient Shadow */}
            <div className="product-shadow-wrap absolute bottom-0 md:bottom-[-5%] w-full">
              <div className={cn(
                "w-full h-8 bg-black/10 blur-[40px] rounded-full scale-x-75 transition-opacity duration-1000",
                isDark ? "opacity-30" : "opacity-20"
              )} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentProduct + (isDark ? "-dark" : "-light")}
                initial={{ opacity: 0, scale: 0.85, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -20 }}
                transition={{
                  duration: 1.2,
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { duration: 0.8 }
                }}
                className="relative z-10 w-full h-full rounded-[2rem] overflow-hidden"
              >
                <Product3DViewer
                  modelPath={productData[currentProduct].model}
                  theme={isDark ? "dark" : "light"}
                  className="w-full h-full"
                  sectionId="hero"
                  scrollActive={isScrollingIntoSection("hero")}
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

              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex items-center gap-3 mt-8 bg-surface/50 backdrop-blur-md p-2 rounded-full shadow-soft"
          >
            {["protein_chocolate", "soy_powder"].map((prodKey) => (
              <button
                key={prodKey}
                onClick={() => setCurrentProduct(prodKey as any)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-500",
                  currentProduct === prodKey
                    ? "bg-foreground text-background shadow-lg scale-105"
                    : "text-muted hover:text-foreground hover:bg-surface"
                )}
              >
                {PRODUCTS[prodKey as keyof typeof PRODUCTS].name}
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}


