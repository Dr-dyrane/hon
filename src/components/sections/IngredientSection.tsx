"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Leaf, Sparkles, Beaker, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { useMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";
import type { IngredientProfile, MarketingProduct, ProductId } from "@/lib/marketing/types";

const CATEGORIES = ["All", "Proteins", "Seeds", "Botanicals"];

export function IngredientSection() {
  const { ingredients, products, productsById } = useMarketingContent();
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedId, setSelectedId] = useState<string>(ingredients[0]?.id || "");
  const isMobile = useMobile();

  // Filtered ingredients based on category
  const filteredIngredients = useMemo(() => {
    if (activeCategory === "All") return ingredients;
    return ingredients.filter((ing) => ing.category === activeCategory);
  }, [activeCategory, ingredients]);

  // Sync selectedId when category changes
  const currentIngredients = useMemo(() => {
    const list = filteredIngredients;
    if (list.length > 0 && !list.find(i => i.id === selectedId)) {
        // Only auto-switch if the current selection isn't in the new list
        // Actually, let's keep it if it is, otherwise pick first.
    }
    return list;
  }, [filteredIngredients, selectedId]);

  const selectedIngredient = useMemo(() => 
    ingredients.find((ing) => ing.id === selectedId) || ingredients[0]
  , [ingredients, selectedId]);

  // Find products that use this ingredient
  const usedInProducts = useMemo(() => {
    if (!selectedIngredient) return [];
    return products.filter((prod) => 
      selectedIngredient.aliases.some(alias => 
        prod.ingredients.some(pi => pi.toLowerCase().includes(alias.toLowerCase()))
      )
    );
  }, [products, selectedIngredient]);

  return (
    <SectionContainer id="ingredients" className="bg-system-background">
      <div className="container-shell">
        {/* Header */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <HeroEyebrow position="center" animated>
            <Leaf className="mr-3 h-3.5 w-3.5 text-label" />
            Transparency
          </HeroEyebrow>
          <h2 className="mt-8 text-4xl md:text-5xl lg:text-6xl font-headline font-bold text-label tracking-display leading-tight">
            Nothing Hidden. <br /> Nothing Fake.
          </h2>
          <p className="mt-8 text-lg text-secondary-label leading-relaxed tracking-body italic">
            Trace every component of our system. Transparent, plant-based formulation designed for performance.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-6 py-2.5 rounded-full text-[11px] font-semibold uppercase tracking-headline transition-all duration-300",
                activeCategory === cat 
                  ? "bg-label text-system-background shadow-lg scale-105" 
                  : "bg-system-fill text-secondary-label hover:text-label hover:bg-secondary-system-fill"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Explorer Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 items-start">
          
          {/* Main Spotlight Panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIngredient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="card-premium glass-morphism overflow-hidden p-0 min-h-[600px] flex flex-col"
            >
              <div className="relative aspect-video w-full overflow-hidden">
                <Image 
                  src={selectedIngredient.image}
                  alt={selectedIngredient.name}
                  fill
                  className="object-cover mask-soft-edge opacity-90"
                />
                <div className="absolute top-8 left-8 flex gap-3">
                  <span className="bg-label/90 text-system-background backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-headline flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    {selectedIngredient.category}
                  </span>
                  <span className="bg-white/10 text-white backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-headline">
                    {selectedIngredient.role}
                  </span>
                </div>
              </div>

              <div className="p-10 flex-1 flex flex-col justify-center">
                <div className="max-w-xl">
                  <h3 className="text-4xl md:text-5xl font-headline font-bold text-label tracking-display mb-6">
                    {selectedIngredient.name}
                  </h3>
                  <div className="flex items-center gap-3 mb-8">
                     <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                     <span className="text-accent font-semibold uppercase text-[11px] tracking-widest">
                       {selectedIngredient.benefit}
                     </span>
                  </div>
                  <p className="text-xl text-secondary-label leading-relaxed tracking-body mb-12">
                    {selectedIngredient.detail}
                  </p>

                  <div className="pt-10">
                    <h4 className="text-[10px] font-bold uppercase tracking-headline text-tertiary-label mb-6 flex items-center gap-2">
                      <Beaker className="w-3.5 h-3.5" />
                      Formulated In
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      {usedInProducts.map(prod => (
                        <div key={prod.id} className="group/prod flex items-center gap-4 bg-system-fill rounded-2xl p-3 pr-6 transition-all hover:bg-secondary-system-fill">
                           <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/50">
                              <Image src={prod.image || ""} alt={prod.name} fill className="object-contain p-1" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-label uppercase tracking-headline">{prod.name}</span>
                              <span className="text-[9px] text-secondary-label uppercase tracking-body font-medium">{prod.flavor || "Original"}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Ingredient Selector / List */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-bold uppercase tracking-headline text-tertiary-label mb-2 px-2">
              Select Ingredient ({filteredIngredients.length})
            </h4>
            <div className="grid grid-cols-1 gap-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredIngredients.map((ing) => (
                <button
                  key={ing.id}
                  onClick={() => setSelectedId(ing.id)}
                  className={cn(
                    "flex items-center gap-6 p-5 rounded-[32px] transition-all duration-500 text-left",
                    selectedId === ing.id 
                      ? "bg-system-background shadow-float" 
                      : "bg-system-fill/50 hover:bg-system-fill backdrop-blur-sm grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                  )}
                >
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-sm shrink-0">
                    <Image src={ing.image} alt={ing.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-[13px] font-bold text-label uppercase tracking-headline truncate">
                        {ing.name}
                      </h5>
                      {selectedId === ing.id && <CheckCircle2 className="w-4 h-4 text-accent" />}
                    </div>
                    <span className="text-[10px] text-secondary-label font-medium uppercase tracking-body truncate">
                      {ing.benefit}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--separator);
          border-radius: 10px;
        }
      `}</style>
    </SectionContainer>
  );
}
