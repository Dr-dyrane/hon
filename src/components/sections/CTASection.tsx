"use client";

import React from "react";
import Link from "next/link";
import { Rocket } from "lucide-react";
import Image from "next/image";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { Button } from "@/components/ui/Button";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import {
  SHOT_BUNDLE,
  formatNgn,
  getProductPriceSnapshot,
} from "@/lib/commerce";
import type { ProductId } from "@/lib/marketing/types";

export function CTASection() {
  const { homeSectionsByKey, productIds, productsById } = useMarketingContent();
  const { addItem, itemCount, openCart } = useCommerce();
  const ctaSettings = homeSectionsByKey.cta?.settings as
    | { defaultProductId?: ProductId }
    | undefined;
  const defaultProductId =
    ctaSettings?.defaultProductId && productsById[ctaSettings.defaultProductId]
      ? ctaSettings.defaultProductId
      : productIds[0] ?? null;

  if (!defaultProductId || !productsById[defaultProductId]) {
    return null;
  }

  const flagshipProduct = productsById[defaultProductId];
  const flagshipPricing = getProductPriceSnapshot(productsById, defaultProductId);
  const ctaBadges = ["Subsidized", SHOT_BUNDLE.shortLabel, "WhatsApp Checkout"];

  const handlePrimaryAction = () => {
    if (itemCount > 0) {
      openCart();
      return;
    }

    addItem(defaultProductId);
  };

  return (
    <SectionContainer
      id="cta"
      className="relative flex items-center justify-center px-4 pb-32 pt-20"
    >
      <div className="container-shell">
        <div className="mx-auto max-w-2xl text-center">
          <HeroEyebrow
            position="center"
            animated
            className="bg-label text-system-background"
          >
            <Rocket className="mr-3 h-3.5 w-3.5" />
            Get Started
          </HeroEyebrow>

          <div className="mt-16 flex flex-wrap justify-center gap-3">
            {ctaBadges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-2 rounded-full bg-system-fill/90 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label shadow-soft dark:bg-white/[0.05] dark:text-white/65"
              >
                <span className="h-1 w-1 rounded-full bg-accent" />
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div
          data-aos="zoom-in-up"
          data-aos-duration="1000"
          data-aos-delay="200"
          className="cta-inverse squircle relative mx-auto w-full max-w-6xl overflow-hidden shadow-float"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute right-0 top-0 h-full w-[80%] animate-pulse bg-[radial-gradient(circle_at_top_right,_#d7c5a3_0%,_transparent_70%)] opacity-20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-full w-[60%] bg-[radial-gradient(circle_at_bottom_left,_#d7c5a3_0%,_transparent_60%)] opacity-10 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto grid max-w-5xl gap-8 px-6 py-20 md:px-12 md:py-24 lg:grid-cols-[minmax(0,1.22fr)_minmax(240px,0.58fr)] lg:items-end">
            <div>
              <span className="mb-8 inline-flex rounded-full bg-white/8 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-accent">
                Shop
              </span>

              <h2 className="text-5xl font-bold leading-tight tracking-display md:text-7xl">
                Upgrade Your <br /> Protein.
              </h2>

              <p className="mt-8 max-w-2xl text-base leading-relaxed tracking-body text-white/70 sm:text-lg">
                Train hard. Stack smart. 4 shots for NGN 4,499.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  variant="primary"
                  className="!h-[72px] px-10 liquid-glass text-sm font-semibold uppercase tracking-headline !bg-accent !text-accent-label shadow-float"
                  onClick={handlePrimaryAction}
                >
                  {itemCount > 0 ? "Review Cart" : "Add Prax Protein"}
                </Button>

                <Link
                  href="#shop"
                  className="button-secondary !h-[72px] px-10 text-sm font-semibold uppercase tracking-headline text-accent shadow-soft"
                >
                  Browse All Products
                </Link>
              </div>
            </div>

            <div className="liquid-glass squircle relative overflow-hidden p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-6">
              <div className="absolute right-2 top-4 h-20 w-20 rounded-full bg-accent/10 blur-3xl" />
              <p className="text-[10px] font-semibold uppercase tracking-headline text-white/55">
                {flagshipProduct?.name ?? "Prax Protein"}
              </p>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-3xl font-bold tracking-tight text-white sm:text-[2rem]">
                    {formatNgn(flagshipPricing.currentNgn)}
                  </div>
                  <p className="mt-2 text-sm tracking-body text-white/65">
                    Single unit.
                  </p>
                </div>

                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full bg-accent/12 blur-2xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-[22px] bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <Image
                      src={
                        flagshipProduct?.image ??
                        "/images/products/protein_chocolate.png"
                      }
                      alt={`${flagshipProduct?.name ?? "Prax Protein"} pack`}
                      width={120}
                      height={120}
                      className="hero-product-image w-full max-w-[68px]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] bg-black/14 p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm tracking-body text-white/65">
                    Bundle
                  </span>
                  <span className="text-base font-semibold tracking-tight text-accent">
                    {SHOT_BUNDLE.shortLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
