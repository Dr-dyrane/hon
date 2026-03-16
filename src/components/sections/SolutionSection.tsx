"use client";

import React, { useState, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { BRAND, PRODUCTS } from "@/lib/data";
import { CleanIcon, PlantIcon, DigestionIcon } from "@/components/ui/Icons";
import { Product3DViewer } from "@/components/3d/Product3DViewer";
import { useScrollAware3D } from "@/hooks/useScrollAware3D";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const TRUST_INDICATORS = [
  { label: "Clean Ingredients", icon: CleanIcon, description: "Zero artificial additives" },
  { label: "Plant-Based", icon: PlantIcon, description: "100% vegan formula" },
  { label: "Easy Digestion", icon: DigestionIcon, description: "Gut-friendly blend" },
  { label: "Zero Additives", icon: CleanIcon, description: "Nothing unnecessary" }
];

export function SolutionSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<keyof typeof PRODUCTS>("protein_chocolate");
  const sectionRef = useRef<HTMLElement>(null);
  const productRef = useRef(null);
  const isProductInView = useInView(productRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const productScale = useTransform(scrollYProgress, [0.2, 0.5], [0.8, 1]);
  const productOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);

  const { isScrollingIntoSection } = useScrollAware3D({
    sectionIds: ["hero", "solution", "shop"],
  });

  const toggleProduct = () => {
    setCurrentProduct(prev => prev === "protein_chocolate" ? "soy_powder" : "protein_chocolate");
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const productData: Record<string, { model: string }> = {
    protein_chocolate: {
      model: "/models/products/protein_chocolate.glb",
    },
    soy_powder: {
      model: "/models/products/soy_powder.glb",
    }
  };

  return (
    <SectionContainer ref={sectionRef} variant="white" id="solution" className="relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-accent/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Header */}
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-6"
        >
          The System
        </motion.span>
        
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-headline text-foreground"
        >
          Meet {BRAND.name}.
        </motion.h2>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-6 text-body-lg text-muted max-w-xl leading-relaxed"
        >
          Protein redesigned for the modern athlete. No fillers, no excuses. 
          Just pure, plant-powered performance.
        </motion.p>

        {/* Trust Indicators */}
        <div className="mt-20 w-full grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-4xl">
          {TRUST_INDICATORS.map((indicator, i) => {
            const Icon = indicator.icon;
            return (
              <motion.div
                key={indicator.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center group"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, y: -4 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-5 shadow-soft group-hover:shadow-card transition-all duration-500"
                >
                  <Icon size={24} className="text-accent" />
                </motion.div>
                <span className="text-[11px] font-semibold text-foreground/80 tracking-wide uppercase">
                  {indicator.label}
                </span>
                <span className="mt-1 text-[10px] text-muted/50">
                  {indicator.description}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Product Showcase */}
        <motion.div
          ref={productRef}
          style={{ scale: productScale, opacity: productOpacity }}
          className="mt-24 relative w-full max-w-md aspect-square flex items-center justify-center perspective-2000"
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="w-[70%] h-[70%] rounded-full bg-accent/10 blur-[80px]"
            />
          </div>

          {/* Rotating orbit rings */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-accent/[0.05] pointer-events-none"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[10%] rounded-full border border-accent/[0.08] pointer-events-none"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isProductInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-64 md:w-80 h-80 md:h-[400px] cursor-pointer"
            onClick={toggleProduct}
          >
            <Product3DViewer
              modelPath={productData[currentProduct].model}
              theme={isDark ? "dark" : "light"}
              className="w-full h-full"
              sectionId="solution"
              scrollActive={isScrollingIntoSection("solution")}
            />
          </motion.div>
        </motion.div>

        {/* Subtle hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.4 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-8 text-[10px] font-medium tracking-widest text-muted uppercase"
        >
          Click to explore
        </motion.p>
      </div>
    </SectionContainer>
  );
}
