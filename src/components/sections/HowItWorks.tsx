"use client";

import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

const steps = [
  { label: "1 Scoop", sub: "Clean Fuel", detail: "30g serving" },
  { label: "Water", sub: "Or Milk", detail: "300ml liquid" },
  { label: "Shake", sub: "30 Seconds", detail: "Mix well" },
  { label: "Growth", sub: "Recover", detail: "Fuel your body" }
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef(null);
  const stepsRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });
  const isStepsInView = useInView(stepsRef, { once: true, margin: "-50px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const imageScale = useTransform(scrollYProgress, [0.1, 0.4], [0.95, 1.02]);
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

  return (
    <SectionContainer ref={sectionRef} variant="alt" id="how-it-works" className="relative overflow-hidden">
      {/* Header */}
      <div ref={headerRef} className="text-center mb-20">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-6"
        >
          The Ritual
        </motion.span>
        
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-headline text-foreground"
        >
          Simple Daily Fuel.
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-6 text-body-lg text-muted max-w-lg mx-auto"
        >
          A minimalist ritual designed for the maximalist life. 
          Pure performance in under 30 seconds.
        </motion.p>
      </div>

      {/* Hero Image */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-5xl mx-auto rounded-[40px] overflow-hidden shadow-float mb-20"
      >
        <motion.div 
          style={{ scale: imageScale, y: imageY }}
          className="relative"
        >
          <Image 
            src="/images/how-it-works.png" 
            alt="How it works ritual" 
            width={1200} 
            height={600} 
            className="w-full h-[280px] md:h-[450px] object-cover"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30" />
        </motion.div>

        {/* Floating badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-morphism px-6 py-3 rounded-full shadow-card"
        >
          <span className="text-[10px] font-semibold tracking-widest text-muted uppercase">
            Under 30 Seconds
          </span>
        </motion.div>
      </motion.div>

      {/* Steps */}
      <div ref={stepsRef} className="container-shell flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isStepsInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                delay: i * 0.1,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="flex flex-col items-center group"
            >
              {/* Step indicator */}
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
                className="w-16 h-16 rounded-2xl bg-background flex items-center justify-center mb-6 shadow-soft group-hover:shadow-card transition-all duration-500"
              >
                <span className="text-2xl font-bold text-accent/80">{i + 1}</span>
              </motion.div>
              
              {/* Step label */}
              <h3 className="text-lg font-semibold text-foreground tracking-tight">
                {step.label}
              </h3>
              <p className="text-[10px] text-accent/60 font-semibold uppercase tracking-widest mt-2">
                {step.sub}
              </p>
              <p className="text-[10px] text-muted/40 mt-1">
                {step.detail}
              </p>
            </motion.div>
            
            {/* Arrow connector */}
            {i < steps.length - 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={isStepsInView ? { opacity: 0.3, x: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="hidden md:flex text-muted/30"
              >
                <ArrowRight size={20} strokeWidth={1.5} />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Bottom badge */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-20 flex justify-center"
      >
        <div className="bg-background px-8 py-4 rounded-full shadow-soft">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            Total Prep Time: <span className="text-accent">Under 30 Seconds</span>
          </span>
        </div>
      </motion.div>
    </SectionContainer>
  );
}
