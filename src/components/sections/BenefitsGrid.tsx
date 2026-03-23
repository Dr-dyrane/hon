"use client";

import React from "react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { LiquidGlassCard } from "@/components/ui/LiquidGlassCard";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { useMobile } from "@/hooks/useMobile";
import { Zap, Wind, Activity, Leaf, Sparkles } from "lucide-react";
import type { MarketingBenefit } from "@/lib/marketing/types";

const ICON_MAP = {
  Zap: Zap,
  Wind: Wind,
  Activity: Activity,
  Leaf: Leaf,
};

export function BenefitsGrid() {
  const { benefits } = useMarketingContent();
  const isMobile = useMobile();

  const MobileBenefitCard = ({
    benefit,
    index,
  }: {
    benefit: MarketingBenefit;
    index: number;
  }) => {
    const Icon = ICON_MAP[benefit.icon as keyof typeof ICON_MAP] || Activity;
    return (
      <LiquidGlassCard
        key={`mobile-${benefit.title}`}
        variant="default"
        intensity="subtle"
        interactive={true}
        className="min-h-[180px] p-4 flex flex-col justify-between overflow-hidden squircle h-full w-full"
        data-aos="zoom-in-up"
        data-aos-duration="600"
        data-aos-delay={400 + index * 100}
      >
        <div className="absolute -right-10 -bottom-10 w-20 h-20 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />

        <div className="relative z-10 flex flex-col justify-between h-full w-full text-left">
          <div className="w-10 h-10 bg-system-fill rounded-2xl flex items-center justify-center text-accent shadow-sm group-hover:scale-110 group-hover:shadow-soft transition-all duration-700 squircle">
            <Icon size={16} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-headline font-bold text-label tracking-headline">{benefit.title}</h3>
            <p className="text-secondary-label opacity-60 text-xs leading-tight tracking-body line-clamp-2">
              {benefit.description}
            </p>
            <div className="flex items-center gap-1 overflow-hidden">
              <div className="h-[1px] w-4 bg-accent/30 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
              <span className="text-[8px] font-semibold uppercase tracking-headline text-accent opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-700">Result</span>
            </div>
          </div>
        </div>
      </LiquidGlassCard>
    );
  };

  const DesktopBenefitCard = ({ benefit }: { benefit: MarketingBenefit }) => {
    const Icon = ICON_MAP[benefit.icon as keyof typeof ICON_MAP] || Activity;
    return (
      <LiquidGlassCard
        key={`desktop-${benefit.title}`}
        variant="default"
        intensity="subtle"
        interactive={true}
        className="min-h-[300px] p-10 flex flex-col justify-between overflow-hidden squircle text-left"
        data-aos="zoom-in-up"
        data-aos-duration="600"
        data-aos-delay={400}
      >
        <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors" />

        <div className="relative z-10">
          <div className="w-14 h-14 bg-system-fill rounded-2xl flex items-center justify-center mb-10 text-accent shadow-sm group-hover:scale-110 group-hover:shadow-soft transition-all duration-700 squircle">
            <Icon size={24} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-headline font-bold text-label tracking-headline">{benefit.title}</h3>
            <p className="text-secondary-label opacity-60 text-sm leading-normal tracking-body">
              {benefit.description}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 overflow-hidden">
          <div className="h-[1px] w-8 bg-accent/30 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
          <span className="text-[9px] font-semibold uppercase tracking-headline text-accent opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-700">Measured Result</span>
        </div>
      </LiquidGlassCard>
    );
  };

  return (
    <SectionContainer variant="alt" id="benefits">
      <div className="container-shell">
        <div className="flex flex-col lg:flex-row items-start justify-between mb-32 gap-y-12 gap-x-20">
          <div className="max-w-4xl text-left">
            <HeroEyebrow
              position="left"
              animated
              className="bg-label text-system-background"
            >
              <Sparkles className="w-3.5 h-3.5 mr-3" />
              Capabilities
            </HeroEyebrow>
            <h2
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-delay="200"
              className="text-5xl md:text-8xl lg:text-9xl font-headline font-bold text-label tracking-display leading-[0.85] text-balance mt-12"
            >
              Built for <br /> <span className="text-secondary-label opacity-20 tracking-tight">Real Performance.</span>
            </h2>
          </div>

          <p
            data-aos="fade-left"
            data-aos-duration="700"
            data-aos-delay="300"
            className="text-secondary-label opacity-60 text-lg md:text-xl font-medium tracking-body max-w-md lg:text-right leading-normal mt-12 lg:mt-48 italic"
          >
            Each benefit is a result of meticulous engineering and plant-powered science.
          </p>
        </div>

        {isMobile ? (
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, i) => (
              <MobileBenefitCard key={benefit.title} benefit={benefit} index={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => (
              <DesktopBenefitCard key={benefit.title} benefit={benefit} />
            ))}
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
