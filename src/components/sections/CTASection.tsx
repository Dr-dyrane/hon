"use client";

import React, { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { Button } from "@/components/ui/Button";

export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef(null);
  const isCardInView = useInView(cardRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const cardScale = useTransform(scrollYProgress, [0.1, 0.4], [0.95, 1]);
  const cardY = useTransform(scrollYProgress, [0, 0.5], [60, 0]);

  const handleFinalCheckout = () => {
    const phoneNumber = "+2348060785487";
    const text = "Hello House of Prax, I'm ready to upgrade my protein intake. I'd like to place an order.";
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <SectionContainer 
      ref={sectionRef}
      className="relative pb-32 pt-20 overflow-hidden"
    >
      {/* Ambient bridge from previous section */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-surface-alt/50 to-transparent pointer-events-none" />
      
      <motion.div 
        ref={cardRef}
        style={{ scale: cardScale, y: cardY }}
        className="relative w-full max-w-5xl mx-auto"
      >
        {/* Glow effect behind card */}
        <div className="absolute inset-0 -m-8 bg-accent/[0.08] blur-[80px] rounded-[80px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isCardInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden cta-inverse rounded-[40px] md:rounded-[56px] shadow-float"
        >
          {/* Internal ambient glows */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{ 
                opacity: [0.15, 0.25, 0.15],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-[70%] h-full bg-[radial-gradient(circle_at_top_right,_var(--accent)_0%,_transparent_60%)] opacity-20"
            />
            <div className="absolute bottom-0 left-0 w-[50%] h-full bg-[radial-gradient(circle_at_bottom_left,_var(--accent)_0%,_transparent_50%)] opacity-10" />
          </div>

          <div className="relative z-10 text-center max-w-3xl mx-auto py-20 px-8 md:py-28 md:px-16">
            {/* Eyebrow */}
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={isCardInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-[10px] font-semibold uppercase tracking-[0.25em] text-accent mb-8 block"
            >
              Join the House
            </motion.span>
            
            {/* Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isCardInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-title md:text-headline leading-[0.95] mb-12"
            >
              Upgrade Your
              <br />
              Protein.
            </motion.h2>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isCardInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col items-center gap-8"
            >
              <Button
                size="lg"
                variant="primary"
                className="px-12 md:px-16 min-h-[64px] text-base md:text-lg font-semibold !bg-accent !text-accent-foreground rounded-2xl shadow-float hover:shadow-glow transition-all duration-500"
                onClick={handleFinalCheckout}
              >
                Checkout Now — $54.99
              </Button>

              {/* Trust badges */}
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                {["Plant-Based", "Zero Additives", "Clean Fuel"].map((item, i) => (
                  <motion.span
                    key={item}
                    initial={{ opacity: 0 }}
                    animate={isCardInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
                    className="flex items-center gap-2 hover:text-accent transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent/60" /> 
                    {item}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </SectionContainer>
  );
}
