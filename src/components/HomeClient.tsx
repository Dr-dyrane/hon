"use client";

import { useScrollAware3D } from "@/hooks/useScrollAware3D";
import { Navbar } from "@/components/sections/Navbar";
import { ScrollNav } from "@/components/ui/ScrollNav";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { SolutionSection } from "@/components/sections/SolutionSection";
import { BenefitsGrid } from "@/components/sections/BenefitsGrid";
import { IngredientSection } from "@/components/sections/IngredientSection";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { LifestyleGallery } from "@/components/sections/LifestyleGallery";
import { ProductSelector } from "@/components/sections/ProductSelector";
import { SocialProof } from "@/components/sections/SocialProof";
import { CTASection } from "@/components/sections/CTASection";
import { Footer } from "@/components/sections/Footer";

export function HomeClient() {
  // Centralized scroll-aware 3D animation - only ONE Intersection Observer instance
  const { activeSection, isScrollingIntoSection, isScrollingOutOfSection } = useScrollAware3D({
    sectionIds: ["hero", "solution", "shop"],
  });

  return (
    <main className="relative max-w-screen overflow-clip">
      <Navbar />
      <ScrollNav />
      <HeroSection 
        activeSection={activeSection}
        isScrollingIntoSection={isScrollingIntoSection}
        isScrollingOutOfSection={isScrollingOutOfSection}
      />
      <ProblemSection />
      <SolutionSection 
        activeSection={activeSection}
        isScrollingIntoSection={isScrollingIntoSection}
        isScrollingOutOfSection={isScrollingOutOfSection}
      />
      <BenefitsGrid />
      <IngredientSection />
      <HowItWorks />
      <LifestyleGallery />
      <ProductSelector 
        activeSection={activeSection}
        isScrollingIntoSection={isScrollingIntoSection}
        isScrollingOutOfSection={isScrollingOutOfSection}
      />
      <SocialProof />
      <CTASection />
      <Footer />
      
      {/* 
        The following sections will be built out to match the README rhythm:
        - HeroSection (White)
        - ProblemSection (Cream/alt)
        - SolutionSection (White)
        - BenefitsGrid (Cream/alt)
        - IngredientSection (White)
        - HowItWorks (Cream/alt)
        - LifestyleGallery (Image Full)
        - ProductSelector (White)
        - SocialProof (Cream/alt)
        - CTASection (White wrapper, colored pill)
        - Footer 
      */}
    </main>
  );
}
