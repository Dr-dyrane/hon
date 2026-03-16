"use client";

import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { SOCIAL_PROOF } from "@/lib/data";
import { Star } from "lucide-react";

const stats = [
  { label: "Elite Rating", value: `${SOCIAL_PROOF.rating}`, sub: "Verified Reviews" },
  { label: "Community", value: SOCIAL_PROOF.servings, sub: "Athletes Reached" },
  { label: "Ingredient Quality", value: "100%", sub: "Zero Fillers" }
];

export function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef(null);
  const statsRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });
  const isStatsInView = useInView(statsRef, { once: true, margin: "-50px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  return (
    <SectionContainer ref={sectionRef} variant="alt" id="social" className="relative overflow-hidden">
      {/* Ambient background */}
      <motion.div 
        style={{ y: backgroundY }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] rounded-full bg-accent/[0.04] blur-[150px]" />
      </motion.div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-20">
          {/* Star Rating */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center space-x-1 mb-8"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={isHeaderInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
              >
                <Star size={16} fill="currentColor" stroke="none" className="text-accent/50" />
              </motion.div>
            ))}
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-headline text-foreground"
          >
            Trusted by the Driven.
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 text-body-lg text-muted max-w-lg mx-auto"
          >
            Powering thousands of sessions daily. Join a community built 
            on uncompromising standards.
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24 max-w-4xl mx-auto w-full">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isStatsInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                delay: i * 0.15,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="text-center group"
            >
              {/* Big number */}
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground mb-4 tracking-tight"
              >
                {stat.value}
              </motion.div>
              
              {/* Label */}
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent/50 mb-3">
                {stat.label}
              </div>
              
              {/* Divider */}
              <div className="w-1 h-1 rounded-full bg-accent/20 mx-auto my-6" />
              
              {/* Sub label */}
              <div className="text-[9px] font-medium uppercase tracking-widest text-muted/40">
                {stat.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tagline */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.3 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-24"
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-muted/30">
            Designed for Performance — Refined for Life
          </p>
        </motion.div>
      </div>
    </SectionContainer>
  );
}
