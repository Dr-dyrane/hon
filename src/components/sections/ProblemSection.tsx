"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { SectionContainer } from "@/components/ui/SectionContainer";

const PROBLEMS = [
  { title: "Artificial Sweeteners", description: "Hidden chemicals disrupting your gut" },
  { title: "Dairy Bloat", description: "Inflammation you don't need" },
  { title: "Cheap Fillers", description: "Empty calories, zero value" },
  { title: "Harsh Digestion", description: "Your body fights the fuel" }
];

// Word reveal animation component
function AnimatedText({ 
  text, 
  className = "",
  delay = 0 
}: { 
  text: string; 
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <span ref={ref} className={cn("inline-block overflow-hidden", className)}>
      <motion.span
        initial={{ y: "100%" }}
        animate={isInView ? { y: 0 } : { y: "100%" }}
        transition={{
          duration: 0.8,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="inline-block"
      >
        {text}
      </motion.span>
    </span>
  );
}

export function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef(null);
  const isCardsInView = useInView(cardsRef, { once: true, margin: "-50px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <SectionContainer 
      ref={sectionRef}
      variant="alt" 
      id="problem" 
      className="overflow-hidden relative"
    >
      {/* Subtle animated background */}
      <motion.div 
        style={{ y: backgroundY }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-1/4 -left-1/4 w-[50vw] h-[50vw] rounded-full bg-accent/5 blur-[150px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[40vw] h-[40vw] rounded-full bg-accent/3 blur-[120px]" />
      </motion.div>

      <div className="relative z-10 flex flex-col lg:flex-row items-start gap-20 lg:gap-32">
        {/* Left side - Typography */}
        <div className="lg:w-1/2 lg:sticky lg:top-40">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent/60 mb-8 block"
          >
            The Market Status
          </motion.span>
          
          <h2 className="text-headline text-foreground">
            <AnimatedText text="Most Protein" delay={0.1} />
            <br />
            <span className="text-muted/20">
              <AnimatedText text="Are Junk." delay={0.2} />
            </span>
          </h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-10 text-body-lg text-muted/60 max-w-md leading-relaxed"
          >
            The industry is built on compromises. We chose a different path—prioritizing 
            gut health and biological performance over cheap manufacturing.
          </motion.p>
        </div>

        {/* Right side - Problem cards */}
        <div ref={cardsRef} className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {PROBLEMS.map((problem, i) => (
            <motion.div
              key={problem.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isCardsInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.1 + i * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="group relative bg-background/60 backdrop-blur-sm p-8 lg:p-10 flex flex-col items-start justify-between min-h-[200px] rounded-[28px] hover:bg-background hover:shadow-float transition-all duration-500"
            >
              {/* Number indicator */}
              <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center text-accent text-[10px] font-bold tracking-widest group-hover:bg-accent/10 group-hover:scale-110 transition-all duration-500">
                0{i + 1}
              </div>
              
              <div className="mt-auto">
                <h3 className="text-xl font-semibold text-foreground tracking-tight group-hover:text-accent transition-colors duration-300">
                  {problem.title}
                </h3>
                <p className="mt-2 text-sm text-muted/50 group-hover:text-muted/70 transition-colors duration-300">
                  {problem.description}
                </p>
                
                {/* Animated underline */}
                <div className="h-[2px] w-0 bg-accent/30 mt-4 group-hover:w-full transition-all duration-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Manifesto Card */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-40"
      >
        {/* Glow effect */}
        <div className="absolute inset-x-0 -top-20 h-40 bg-[radial-gradient(circle_at_center,_var(--accent)_0%,_transparent_70%)] opacity-[0.08] blur-3xl pointer-events-none" />

        <div className="p-16 md:p-24 lg:p-32 rounded-[40px] md:rounded-[56px] cta-inverse text-center relative overflow-hidden">
          {/* Internal glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--accent)_0%,_transparent_60%)] opacity-10 pointer-events-none" />

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent mb-8 block"
          >
            Perspective
          </motion.span>

          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative z-10 text-title md:text-headline mb-10 leading-[0.95]"
          >
            Your body deserves
            <br />
            better fuel.
          </motion.h3>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="w-12 h-[2px] bg-accent/40 mx-auto mb-10"
          />

          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.6 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="relative z-10 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed"
          >
            "Don't build your foundation on sand. Choose a system 
            designed for longevity and power."
          </motion.p>
        </div>
      </motion.div>
    </SectionContainer>
  );
}
