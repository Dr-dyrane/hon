"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { BENEFITS } from "@/lib/data";
import { Zap, Wind, Activity, Leaf } from "lucide-react";

const ICON_MAP = {
  Zap: Zap,
  Wind: Wind,
  Activity: Activity,
  Leaf: Leaf,
};

export function BenefitsGrid() {
  const headerRef = useRef(null);
  const cardsRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });
  const isCardsInView = useInView(cardsRef, { once: true, margin: "-50px" });

  return (
    <SectionContainer variant="alt" id="benefits" className="relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[60vw] h-[60vw] rounded-full bg-accent/[0.04] blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] rounded-full bg-accent/[0.03] blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div ref={headerRef} className="flex flex-col lg:flex-row items-start justify-between mb-24 lg:mb-32 gap-y-10 gap-x-20">
          <div className="max-w-3xl">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-6"
            >
              Capabilities
            </motion.span>
            
            <motion.h2 
              initial={{ opacity: 0, y: 40 }}
              animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-display text-foreground"
            >
              Built for
              <br />
              <span className="text-muted/15">Real Performance.</span>
            </motion.h2>
          </div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-muted/50 text-lg md:text-xl max-w-sm lg:text-right leading-relaxed lg:mt-auto"
          >
            Each benefit is a result of meticulous engineering and plant-powered science.
          </motion.p>
        </div>

        {/* Benefits Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFITS.map((benefit, i) => {
            const Icon = ICON_MAP[benefit.icon as keyof typeof ICON_MAP];
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 50 }}
                animate={isCardsInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: i * 0.1,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="group relative min-h-[340px] rounded-[32px] bg-background p-8 flex flex-col justify-between overflow-hidden shadow-soft hover:shadow-float transition-all duration-500"
              >
                {/* Hover glow */}
                <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center mb-8 text-accent shadow-soft group-hover:shadow-card transition-all duration-500"
                  >
                    <Icon size={22} strokeWidth={1.5} />
                  </motion.div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-semibold text-foreground mb-4 tracking-tight group-hover:text-accent transition-colors duration-300">
                    {benefit.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-muted/50 text-sm leading-relaxed group-hover:text-muted/70 transition-colors duration-300">
                    {benefit.description}
                  </p>
                </div>
                
                {/* Bottom indicator */}
                <div className="relative z-10 flex items-center gap-2 mt-auto pt-6 overflow-hidden">
                  <motion.div 
                    className="h-[1.5px] bg-accent/30 origin-left"
                    initial={{ scaleX: 0, width: 24 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-accent opacity-0 group-hover:opacity-70 translate-x-2 group-hover:translate-x-0 transition-all duration-500">
                    Measured Result
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionContainer>
  );
}
