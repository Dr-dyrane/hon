"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { Badge } from "@/components/ui/Badge";
import { SOCIAL_PROOF } from "@/lib/data";
import { Star } from "lucide-react";

export function SocialProof() {
  const stats = [
    { label: "Elite Rating", value: `${SOCIAL_PROOF.rating}`, sub: "Verified Reviews" },
    { label: "Community", value: SOCIAL_PROOF.servings, sub: "Athletes Reached" },
    { label: "Ingredient Quality", value: "100%", sub: "Zero Fillers" }
  ];

  return (
    <SectionContainer variant="alt" id="social" className="overflow-hidden">
      <div className="flex flex-col items-center">
        <div className="text-center mb-12">
          <div 
            data-aos="fade-down"
            data-aos-duration="600"
            data-aos-delay="100"
            className="flex items-center justify-center space-x-1 mb-12 text-accent/40"
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill="currentColor" stroke="none" />
            ))}
          </div>
          <h2 
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="200"
            className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold text-label tracking-display leading-tight"
          >
            Trusted by the Driven.
          </h2>
        </div>

        <p
          data-aos="fade-up"
          data-aos-duration="700"
          data-aos-delay="300"
          className="text-xl text-secondary-label leading-normal tracking-body max-w-xl mx-auto text-center italic"
        >
          Powering thousands of sessions daily. Join a community built on uncompromising standards.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24 max-w-6xl mx-auto w-full mt-8">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              data-aos="zoom-in-up"
              data-aos-duration="600"
              data-aos-delay={400 + i * 100}
              className="text-center group"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="text-5xl md:text-8xl font-headline font-bold text-label mb-6 tracking-display italic group-hover:scale-110 transition-transform duration-700"
              >
                {stat.value}
              </motion.div>

              <Badge 
                variant="accent" 
                size="sm" 
                animated={true}
                className="mb-3 font-semibold tracking-headline"
              >
                {stat.label}
              </Badge>
              <div className="w-1.5 h-1.5 rounded-full bg-accent/20 mx-auto my-8" />
              <div className="text-secondary-label opacity-40 text-[10px] font-semibold uppercase tracking-headline">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div 
          data-aos="fade-up"
          data-aos-duration="700"
          data-aos-delay="800"
          className="mt-32 opacity-20 filter grayscale"
        >
          <motion.div
            whileHover={{ filter: "grayscale(0%)", opacity: 0.4 }}
            transition={{ duration: 0.5 }}
          >
            {/* Subtle separator or secondary social proof */}
            <div className="text-[9px] font-semibold uppercase tracking-headline text-secondary-label">
              Designed for Performance — Refined for Life
            </div>
          </motion.div>
        </div>
      </div>
    </SectionContainer>
  );
}

