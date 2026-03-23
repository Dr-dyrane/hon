"use client";

import React, { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { Button } from "@/components/ui/Button";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { useMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";

const DRAG_THRESHOLD = 56;

export function IngredientSection() {
  const { ingredients } = useMarketingContent();
  const isMobile = useMobile(960);
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const ingredientCount = ingredients.length;
  const activeIngredient = ingredients[activeIndex];

  const canUseDesktopDrag = !isMobile;
  const canUseMotion = !prefersReducedMotion;

  const previousIngredient = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + ingredientCount) % ingredientCount);
  }, [ingredientCount]);

  const nextIngredient = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % ingredientCount);
  }, [ingredientCount]);

  const onDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (!canUseDesktopDrag) return;

      if (info.offset.x < -DRAG_THRESHOLD || info.velocity.x < -520) {
        nextIngredient();
        return;
      }
      if (info.offset.x > DRAG_THRESHOLD || info.velocity.x > 520) {
        previousIngredient();
      }
    },
    [canUseDesktopDrag, nextIngredient, previousIngredient]
  );

  const activeLabel = useMemo(
    () => (activeIndex + 1).toString().padStart(2, "0"),
    [activeIndex]
  );

  if (!activeIngredient) return null;

  return (
    <SectionContainer
      id="ingredients"
      spacing="flow"
      className="relative overflow-hidden bg-system-background"
    >
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={
            canUseMotion
              ? { scale: [1, 1.06, 1], opacity: [0.05, 0.09, 0.05] }
              : undefined
          }
          transition={
            canUseMotion
              ? { duration: 12, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
          className="absolute left-1/2 top-1/2 h-[68%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[130px]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-system-background/15 via-transparent to-system-background/55" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="mb-12 flex flex-col items-center text-center sm:mb-16">
          <HeroEyebrow position="center" animated className="bg-label text-system-background">
            <Leaf className="mr-3 h-3.5 w-3.5" />
            Ingredient Story
          </HeroEyebrow>
          <h2 className="mt-8 text-balance text-4xl font-headline font-bold tracking-tight text-label sm:text-6xl md:text-7xl lg:text-[112px] lg:leading-[0.78]">
            Meet House
            <span className="block italic opacity-25">of Prax.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="order-2 lg:order-1 lg:col-span-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`copy-${activeIngredient.id}`}
                initial={canUseMotion ? { opacity: 0, y: 16 } : undefined}
                animate={{ opacity: 1, y: 0 }}
                exit={canUseMotion ? { opacity: 0, y: -10 } : undefined}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5 sm:space-y-6"
              >
                <span className="inline-flex w-fit rounded-full bg-system-background/85 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-label/75 shadow-soft backdrop-blur-sm">
                  {activeIngredient.category}
                </span>

                <h3 className="text-pretty text-4xl font-headline font-bold leading-[0.95] tracking-tight text-label sm:text-5xl md:text-6xl">
                  {activeIngredient.name}
                </h3>

                <p className="max-w-xl text-base leading-relaxed text-secondary-label sm:text-lg">
                  {activeIngredient.detail}
                </p>

                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent sm:text-[0.78rem]">
                  {activeIngredient.benefit}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-7">
            <motion.div
              drag={canUseDesktopDrag ? "x" : false}
              dragConstraints={canUseDesktopDrag ? { left: 0, right: 0 } : undefined}
              onDragEnd={canUseDesktopDrag ? onDragEnd : undefined}
              className="relative overflow-hidden rounded-[28px] shadow-float sm:rounded-[34px]"
            >
              <div className="relative aspect-[4/5] w-full sm:aspect-[5/4] md:aspect-[16/10]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`image-${activeIngredient.id}`}
                    initial={canUseMotion ? { opacity: 0.5, scale: 1.02 } : undefined}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={canUseMotion ? { opacity: 0.5, scale: 0.985 } : undefined}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={activeIngredient.image}
                      alt={activeIngredient.name}
                      fill
                      priority={activeIndex === 0}
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 72vw, 52vw"
                      className="object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-system-background/68 via-system-background/10 to-transparent" />
                  </motion.div>
                </AnimatePresence>
              </div>

              {canUseDesktopDrag ? (
                <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-system-background/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-label/75 backdrop-blur-sm">
                  Drag left or right
                </div>
              ) : null}
            </motion.div>

            <div className="mt-5 flex items-center justify-between gap-3 sm:mt-6">
              <div className="flex items-center gap-2.5">
                {ingredients.map((ingredient, index) => (
                  <button
                    key={ingredient.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      index === activeIndex ? "w-9 bg-label" : "w-2.5 bg-label/20 hover:bg-label/45"
                    )}
                    aria-label={`Select ${ingredient.name}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold tracking-[0.12em] text-label/40">
                  {activeLabel} / {ingredientCount.toString().padStart(2, "0")}
                </span>
                <Button
                  type="button"
                  onClick={previousIngredient}
                  variant="secondary"
                  size="md"
                  className="h-10 min-h-10 w-10 rounded-full px-0 py-0"
                  aria-label="Previous ingredient"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  onClick={nextIngredient}
                  variant="secondary"
                  size="md"
                  className="h-10 min-h-10 w-10 rounded-full px-0 py-0"
                  aria-label="Next ingredient"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
