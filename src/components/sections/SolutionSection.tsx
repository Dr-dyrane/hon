"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { Badge } from "@/components/ui/Badge";
import { BRAND, PRODUCTS } from "@/lib/data";
import { CleanIcon, PlantIcon, DigestionIcon } from "@/components/ui/Icons";
import { Lightbulb } from "lucide-react";
import Image from "next/image";
import { Product3DViewer } from "@/components/3d/Product3DViewer";
import { useTheme } from "next-themes";
import AOS from "aos";

const TRUST_INDICATORS = [
  { label: "Clean Ingredients", icon: CleanIcon },
  { label: "Plant-Based", icon: PlantIcon },
  { label: "Easy Digestion", icon: DigestionIcon },
  { label: "Zero Additives", icon: CleanIcon }
];

export function SolutionSection({ 
  activeSection, 
  isScrollingIntoSection, 
  isScrollingOutOfSection 
}: {
  activeSection: string | null;
  isScrollingIntoSection: (sectionId: string) => boolean;
  isScrollingOutOfSection: (sectionId: string) => boolean;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<keyof typeof PRODUCTS>("protein_chocolate");


  React.useEffect(() => {
    console.log(`🔄 [Solution] Mounted`);
    setMounted(true);
  }, []);

  // Refresh AOS to calculate correct scroll positions for the 3D viewer
  useEffect(() => {
    console.log(`🔄 [Solution] Product changed to: ${currentProduct}, refreshing AOS`);
    AOS.refresh();
  }, [currentProduct]);

  const isDark = mounted && resolvedTheme === "dark";

  const productData: any = {
    protein_chocolate: {
      model: "/models/products/protein_chocolate.glb",
      bgGlow: "bg-[#4A2C2A]/20",
      accent: "text-[#D7C5A3]",
    },
    soy_powder: {
      model: "/models/products/soy_powder.glb",
      bgGlow: "bg-accent/10",
      accent: "text-accent",
    }
  };

  return (
    <SectionContainer variant="white" id="solution">
      <div className="flex flex-col items-center text-center">
        <div className="mb-12">
          <HeroEyebrow 
            position="center"
            animated
          >
            <Lightbulb className="w-3.5 h-3.5 mr-3 text-foreground" />
            The System
          </HeroEyebrow>
          <h2 
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="200"
            className="mt-12 text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-none"
          >
            Meet {BRAND.name}
          </h2>
        </div>

        <p 
          data-aos="fade-up"
          data-aos-duration="700"
          data-aos-delay="300"
          className="text-xl text-muted max-w-2xl font-medium leading-relaxed italic"
        >
          "Protein redesigned for the modern athlete. No fillers, no excuses. Just pure, plant-powered performance."
        </p>

        <div className="mt-24 w-full grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 lg:gap-24 max-w-5xl">
          {TRUST_INDICATORS.map((indicator, i) => {
            const Icon = indicator.icon;
            return (
              <div
                key={indicator.label}
                data-aos="zoom-in-up"
                data-aos-duration="600"
                data-aos-delay={400 + i * 100}
                className="flex flex-col items-center group"
              >
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="w-16 h-16 rounded-2xl surface flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:shadow-float transition-all duration-700"
                >
                   <Icon size={28} className="text-accent" />
                </motion.div>
                <span className="text-[11px] font-bold text-foreground tracking-widest uppercase max-w-[120px] leading-tight opacity-70 group-hover:opacity-100 transition-opacity">
                  {indicator.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-32 relative group perspective-2000">
          <div className="absolute inset-0 bg-accent/5 rounded-full blur-[100px] group-hover:bg-accent/10 transition-colors duration-1000" />
          
          {/* Floating background markers to use whitespace */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/[0.02] rounded-full pointer-events-none"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-accent/[0.03] rounded-full pointer-events-none"
          />

          <Product3DViewer
            modelPath={productData[currentProduct].model}
            theme="light"
            className="relative z-10 mx-auto w-64 md:w-80 h-96 md:h-[450px]"
            sectionId="solution"
            scrollActive={isScrollingIntoSection("solution")}
          />
        </div>
      </div>
    </SectionContainer>
  );
}

