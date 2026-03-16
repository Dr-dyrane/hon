"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { INGREDIENTS } from "@/lib/data";
import Image from "next/image";

export function IngredientSection() {
  const headerRef = useRef(null);
  const cardsRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });
  const isCardsInView = useInView(cardsRef, { once: true, margin: "-50px" });

  return (
    <SectionContainer variant="white" id="ingredients" className="relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 -left-1/4 w-[50vw] h-[50vw] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-start gap-16 lg:gap-24">
        {/* Left - Sticky Header */}
        <div ref={headerRef} className="lg:w-1/3 lg:sticky lg:top-40">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-6"
          >
            Transparency
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-title lg:text-headline text-foreground leading-[1.05]"
          >
            Nothing Hidden.
            <br />
            <span className="text-muted/20">Nothing Fake.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-8 text-lg text-muted leading-relaxed"
          >
            We believe in complete transparency. Every ingredient is meticulously 
            selected for purity and performance.
          </motion.p>
        </div>

        {/* Right - Ingredient Cards */}
        <div ref={cardsRef} className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
          {INGREDIENTS.map((ing, i) => (
            <motion.div
              key={ing.name}
              initial={{ opacity: 0, y: 50 }}
              animate={isCardsInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                delay: i * 0.1,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="group relative h-[320px] rounded-[32px] overflow-hidden bg-surface shadow-soft hover:shadow-float transition-all duration-500"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src={ing.image}
                  alt={ing.name}
                  fill
                  className="object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                {/* Tag - appears on hover */}
                <motion.span 
                  className="text-[9px] font-semibold uppercase tracking-[0.15em] text-accent mb-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500"
                >
                  Essential Ingredient
                </motion.span>
                
                {/* Title */}
                <h3 className="text-2xl font-semibold tracking-tight text-foreground group-hover:-translate-y-1 transition-transform duration-500">
                  {ing.name}
                </h3>
                
                {/* Description - appears on hover */}
                <p className="mt-3 text-sm text-muted leading-relaxed max-w-[220px] translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                  {ing.detail}
                </p>
              </div>

              {/* Hover accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.div>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
