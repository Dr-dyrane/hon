"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { Button } from "@/components/ui/Button";
import { useTheme } from "next-themes";

export function CTASection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleFinalCheckout = () => {
    const phoneNumber = "+2348060785487";
    const text = "Hello House of Prax, I'm ready to upgrade my protein intake. I'd like to place an order.";
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <SectionContainer className="flex items-center justify-center px-4 pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true }}
        className="relative overflow-hidden w-full bg-foreground text-background rounded-[3rem] md:rounded-[4rem] shadow-float max-w-6xl mx-auto"
      >
        {/* Abstract background elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-1/2 -right-1/4 w-full h-full bg-accent/30 rounded-full blur-[120px]" />
          <div className="absolute -bottom-1/2 -left-1/4 w-full h-full bg-accent/20 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto py-24 px-6 md:px-12 md:py-36">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent mb-8 block">
              Join the House
            </span>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tighter">
              Upgrade Your <br /> Protein.
            </h2>

            <div className="mt-16 flex flex-col items-center gap-10">
              <Button
                size="lg"
                variant="primary"
                className="px-12 md:px-20 !h-20 text-lg md:text-xl font-black uppercase tracking-widest !bg-accent !text-accent-foreground rounded-2xl shadow-float hover:scale-105 transition-all duration-500"
                onClick={handleFinalCheckout}
              >
                Checkout Now — $54.99
              </Button>

              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-accent" /> Plant-Based</span>
                <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-accent" /> Zero Additives</span>
                <span className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-accent" /> Clean Fuel</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </SectionContainer>
  );
}

