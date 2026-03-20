"use client";

import React from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { Cog } from "lucide-react";
import { Plus, MoveRight } from "lucide-react";
import Image from "next/image";

export function HowItWorks() {
  const steps = [
    { label: "1 Scoop", sub: "Clean Fuel" },
    { label: "Water", sub: "Or Milk" },
    { label: "Shake", sub: "30 Seconds" },
    { label: "Growth", sub: "Recover" }
  ];

  return (
    <SectionContainer variant="alt" id="how-it-works">
      <div className="flex flex-col items-center justify-center gap-4 text-center mb-12">
        <HeroEyebrow
          position="center"
          animated
          className="bg-label text-system-background"
        >
          <Cog className="w-3.5 h-3.5 mr-3" />
          The Ritual
        </HeroEyebrow>
        <h2
          data-aos="fade-up"
          data-aos-duration="800"
          data-aos-delay="200"
          className="my-12 text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-label tracking-display leading-tight"
        >
          Simple Daily Fuel.
        </h2>

        <p
          data-aos="fade-up"
          data-aos-duration="700"
          data-aos-delay="300"
          className="text-xl text-secondary-label leading-normal tracking-body w-full text-center italic"
        >
          A minimalist ritual designed for the maximalist life. Pure performance in under 30 seconds.
        </p>
      </div>

      <div
        data-aos="zoom-in"
        data-aos-duration="800"
        data-aos-delay="400"
        className="relative max-w-6xl mx-auto squircle overflow-hidden bg-system-background shadow-float mb-20 group"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <Image
            src="/images/how-it-works.png"
            alt="How it works ritual"
            width={1200}
            height={600}
            className="w-full h-[300px] md:h-[500px] object-cover opacity-80 group-hover:scale-105 transition-transform duration-[3s] mask-soft-edge"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-system-background via-transparent to-transparent" />
        </motion.div>
      </div>

      <div className="container-shell flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div
              data-aos="zoom-in-up"
              data-aos-duration="600"
              data-aos-delay={600 + i * 100}
              className="flex flex-col items-center group"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
                className="w-20 h-20 bg-system-fill rounded-2xl flex items-center justify-center mb-8 text-accent shadow-sm group-hover:scale-110 group-hover:shadow-float transition-all duration-700 squircle"
              >
                <span className="text-[10px] font-semibold uppercase tracking-headline text-accent/60">HOP</span>
              </motion.div>
              <h3 className="text-xl font-headline font-bold text-label tracking-headline">{step.label}</h3>
              <p className="text-[10px] text-accent font-semibold uppercase tracking-headline mt-3 opacity-60">{step.sub}</p>
            </div>

            {i < steps.length - 1 && (
              <div
                data-aos="fade-left"
                data-aos-duration="600"
                data-aos-delay={800 + i * 100}
                className="hidden md:flex text-border/40"
              >
                <motion.div
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  {i === steps.length - 2 ? <MoveRight size={24} strokeWidth={1} /> : <Plus size={20} />}
                </motion.div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div
        data-aos="fade-up"
        data-aos-duration="700"
        data-aos-delay="1200"
        className="mt-24 text-center"
      >
        <motion.span
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          className="bg-system-fill px-8 py-4 rounded-full text-[11px] font-semibold uppercase tracking-headline text-secondary-label shadow-sm squircle"
        >
          Total Prep Time: <span className="text-accent underline decoration-2 underline-offset-4 tracking-tight">Under 30 Seconds</span>
        </motion.span>
      </div>
    </SectionContainer>
  );
}

