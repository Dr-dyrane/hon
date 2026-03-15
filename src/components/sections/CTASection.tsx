"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { Button } from "@/components/ui/Button";

export function CTASection() {
  return (
    <SectionContainer className="flex items-center justify-center px-4">
      <div className="relative overflow-hidden w-full bg-accent text-accent-foreground rounded-[2rem] md:rounded-[3rem] shadow-float max-w-6xl mx-auto my-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[60%] h-full bg-background rounded-full blur-[100px] md:blur-[150px] translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[40%] h-full bg-background/80 rounded-full blur-[80px] md:blur-[120px] -translate-x-1/2" />
        </div>

        <div className="relative z-10 text-center max-w-3xl mx-auto py-24 px-6 md:px-12 md:py-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-accent-foreground leading-[0.9] tracking-tight">
              Upgrade Your <br /> Protein.
            </h2>
            <p className="mt-8 text-lg md:text-xl text-accent-foreground opacity-70 max-w-lg mx-auto leading-relaxed">
              Clean plant-based protein for real performance. No junk, no fillers, just fuel.
            </p>

            <div className="mt-12 flex flex-col items-center gap-8">
              <Button size="lg" variant="secondary" className="px-12 md:px-16 text-base md:text-lg !bg-accent-foreground !text-accent shadow-sm hover:shadow-md h-14 rounded-full border-none">
                Buy Now — $54.99
              </Button>

              <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 md:gap-x-8 md:gap-y-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-accent-foreground opacity-60">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent-foreground opacity-40" /> Plant-Based</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent-foreground opacity-40" /> No Additives</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent-foreground opacity-40" /> Easy Digestion</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </SectionContainer>
  );
}
