"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { BadgeList } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useTheme } from "next-themes";
import { Rocket } from "lucide-react";

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
    <SectionContainer id="cta" className="flex items-center justify-center px-4 pb-32 pt-20 relative w-full">
      
      <div className="text-center mb-24 w-full">
        <HeroEyebrow 
          position="center"
          animated
          className="bg-label text-system-background"
        >
          <Rocket className="w-3.5 h-3.5 mr-3" />
          Get Started
        </HeroEyebrow>
        
        <BadgeList 
          items={["Premium Quality", "Fast Shipping", "24/7 Support", "Money Back Guarantee"]}
          className="mt-16 justify-center"
          animated
        />
      </div>
      
      <div 
        data-aos="zoom-in-up"
        data-aos-duration="1000"
        data-aos-delay="200"
        className="relative overflow-hidden w-full cta-inverse squircle shadow-float max-w-6xl mx-auto"
      >
        {/* Abstract background elements - Vibrant Gold Depth */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[80%] h-full bg-[radial-gradient(circle_at_top_right,_#d7c5a3_0%,_transparent_70%)] opacity-20 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[60%] h-full bg-[radial-gradient(circle_at_bottom_left,_#d7c5a3_0%,_transparent_60%)] opacity-10 blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto py-24 px-6 md:px-12 md:py-36">
          <div
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="400"
          >
            <span className="text-[10px] font-semibold uppercase tracking-headline text-accent mb-12 block">
              Join the House
            </span>
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold font-headline leading-tight tracking-display">
              Upgrade Your <br /> Protein.
            </h2>

            <div className="mt-16 flex flex-col items-center gap-10">
              <motion.div
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.05 }}
              >
                <Button
                  size="lg"
                  variant="primary"
                  className="px-12 md:px-20 !h-20 text-lg md:text-xl font-semibold uppercase tracking-headline !bg-accent !text-accent-label squircle shadow-float hover:scale-105 transition-all duration-700 ease-premium ring-offset-system-background hover:ring-2 hover:ring-accent/20"
                  onClick={handleFinalCheckout}
                >
                  Checkout Now — $54.99
                </Button>
              </motion.div>
<BadgeList 
                items={["Plant-Based", "Zero Additives", "Clean Fuel"]}
                className="mt-8"
                animated
              />
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
