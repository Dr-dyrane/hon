"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";

const PROBLEMS = [
  "Artificial Sweeteners",
  "Dairy Bloat",
  "Cheap Fillers",
  "Harsh Digestion"
];

export function ProblemSection() {
  return (
    <SectionContainer variant="alt" id="problem" className="overflow-hidden">
      <div className="flex flex-col lg:flex-row items-center gap-20 py-12">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="lg:w-1/2"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent/60 mb-8 block">The Market Status</span>
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-foreground leading-[0.9] tracking-tighter">
            Most Protein <br /> 
            <span className="text-muted/20">Are Junk.</span>
          </h2>
          <p className="mt-12 text-xl text-muted/60 font-medium leading-relaxed max-w-md">
            The industry is built on compromises. We chose a different path—prioritizing gut health and biological performance over cheap manufacturing.
          </p>
        </motion.div>

        <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {PROBLEMS.map((problem, i) => (
            <motion.div
              key={problem}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-background/40 backdrop-blur-sm border border-border/5 p-10 flex flex-col items-start justify-between min-h-[220px] rounded-[2.5rem] group hover:bg-background transition-all duration-700 hover:shadow-float"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center text-accent text-[10px] font-black tracking-widest border border-accent/10 group-hover:scale-110 transition-transform">
                0{i + 1}
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground tracking-tighter leading-tight group-hover:text-accent transition-colors">{problem}</h3>
                <div className="h-[2px] w-0 bg-accent/20 mt-4 group-hover:w-full transition-all duration-700" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4, duration: 1 }}
        className="mt-32 p-16 rounded-[4rem] bg-foreground text-background text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-accent/10 pointer-events-none blur-3xl rounded-full translate-y-1/2" />
        <h3 className="relative z-10 text-3xl md:text-5xl font-black tracking-tighter mb-6 underline decoration-accent decoration-4 underline-offset-8">
          Your body deserves better fuel.
        </h3>
        <p className="relative z-10 text-background/60 text-lg font-medium max-w-2xl mx-auto italic">
          "Don't build your foundation on sand. Choose a system designed for longevity and power."
        </p>
      </motion.div>
    </SectionContainer>
  );
}

