"use client";

import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import Image from "next/image";
import { cn } from "@/lib/utils";

const IMAGES = [
  { src: "/images/lifestyle/gym.png", alt: "Workout session", span: "md:row-span-2" },
  { src: "/images/lifestyle/smoothie.png", alt: "Smoothie prep", span: "" },
  { src: "/images/lifestyle/desk.png", alt: "Desk work", span: "" },
  { src: "/images/lifestyle/recovery.png", alt: "Post-gym recovery", span: "md:col-span-2" },
];

export function LifestyleGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef(null);
  const galleryRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });
  const isGalleryInView = useInView(galleryRef, { once: true, margin: "-50px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "-5%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

  return (
    <SectionContainer ref={sectionRef} variant="white" id="lifestyle" className="relative overflow-hidden">
      {/* Header */}
      <div ref={headerRef} className="flex flex-col items-center text-center mb-16">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-6"
        >
          Life in HOP
        </motion.span>
        
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-headline text-foreground"
        >
          Fuel Your Training.
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-6 text-body-lg text-muted max-w-lg"
        >
          Designed for the athlete, refined for the everyday. 
          Witness House of Prax in action.
        </motion.p>
      </div>

      {/* Gallery Grid */}
      <div 
        ref={galleryRef}
        className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 auto-rows-[200px] md:auto-rows-[260px] max-w-6xl mx-auto"
      >
        {IMAGES.map((img, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            animate={isGalleryInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              delay: i * 0.1,
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1]
            }}
            style={{ y: i % 2 === 0 ? y1 : y2 }}
            className={cn(
              "relative rounded-[24px] md:rounded-[32px] overflow-hidden group shadow-soft hover:shadow-float transition-shadow duration-500",
              img.span
            )}
          >
            {/* Image */}
            <div className="absolute inset-0">
              <Image 
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {/* Overlays */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Label */}
            <motion.div 
              className="absolute bottom-5 left-5 z-10 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500"
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white bg-black/30 backdrop-blur-md px-4 py-2 rounded-full">
                {img.alt}
              </span>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </SectionContainer>
  );
}
