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
    <SectionContainer variant="alt" id="problem">
      <div className="flex flex-col md:flex-row items-center gap-16 py-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex-1"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground leading-[1.1] tracking-tight">
            Most Protein Powders <br /> 
            <span className="text-muted/60 opacity-80">Are Junk.</span>
          </h2>
        </motion.div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {PROBLEMS.map((problem, i) => (
            <motion.div
              key={problem}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="card-premium p-8 flex flex-col items-start justify-between min-h-[160px]"
            >
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">
                0{i + 1}
              </div>
              <h3 className="text-xl font-bold text-foreground mt-4">{problem}</h3>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center mt-24 text-2xl md:text-3xl font-medium tracking-tight text-foreground/80"
      >
        Your body deserves better fuel.
      </motion.p>
    </SectionContainer>
  );
}
