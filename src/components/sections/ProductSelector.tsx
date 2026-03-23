"use client";

import React, { useDeferredValue, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Box } from "lucide-react";
import { useTheme } from "next-themes";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import {
  SHOT_BUNDLE,
  formatNgn,
  getProductPriceSnapshot,
  isShotProduct,
} from "@/lib/commerce";
import { Button } from "@/components/ui/Button";
import { useCommerce } from "@/components/providers/CommerceProvider";
import { cn } from "@/lib/utils";
import type { MarketingProduct, ProductId } from "@/lib/marketing/types";

const Product3DViewer = dynamic(
  () =>
    import("@/components/3d/Product3DViewer").then((mod) => mod.Product3DViewer),
  { ssr: false }
);

function getProductFlavor(product: MarketingProduct) {
  return product.flavor;
}

function getProductStats(product: MarketingProduct) {
  return Object.entries(product.stats);
}

function ProductArtFallback({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-system-fill/72 text-label/72 shadow-[0_18px_40px_rgba(15,23,42,0.08)] dark:bg-white/[0.06] dark:text-white/72">
        <Box className="h-7 w-7" strokeWidth={1.6} />
      </div>
    </div>
  );
}

export function ProductSelector({
  isScrollingIntoSection,
}: {
  activeSection: string | null;
  isScrollingIntoSection: (sectionId: string) => boolean;
  isScrollingOutOfSection: (sectionId: string) => boolean;
}) {
  const { categories, categoriesById, homeSectionsByKey, productIds, productsById } =
    useMarketingContent();
  const { resolvedTheme } = useTheme();
  const { addItem } = useCommerce();
  const visibleCategories = categories.filter((category) =>
    productIds.some((key) => productsById[key].categoryId === category.id)
  );
  const selectorSettings = homeSectionsByKey.products?.settings as
    | { defaultCategoryId?: string; defaultProductId?: ProductId }
    | undefined;
  const [activeCategory, setActiveCategory] = useState(
    selectorSettings?.defaultCategoryId &&
      visibleCategories.some((category) => category.id === selectorSettings.defaultCategoryId)
      ? selectorSettings.defaultCategoryId
      : visibleCategories[0]?.id ?? categories[0]?.id ?? ""
  );
  const [selectedProduct, setSelectedProduct] = useState<ProductId>(
    selectorSettings?.defaultProductId && productsById[selectorSettings.defaultProductId]
      ? selectorSettings.defaultProductId
      : productIds[0]
  );
  const deferredProduct = useDeferredValue(selectedProduct);

  const scrollActive = isScrollingIntoSection("shop");
  const isDark = resolvedTheme === "dark";

  const filteredProducts = productIds.filter(
    (key) => productsById[key].categoryId === activeCategory
  );
  const safeSelectedProduct =
    filteredProducts.find((key) => key === selectedProduct) ??
    filteredProducts[0] ??
    productIds[0];
  const activeProduct = productsById[safeSelectedProduct];
  const activeIsShot = isShotProduct(productsById, safeSelectedProduct);
  const statEntries = getProductStats(activeProduct);
  const pricing = getProductPriceSnapshot(productsById, safeSelectedProduct);
  const stageProduct =
    productsById[productIds.includes(deferredProduct) ? deferredProduct : safeSelectedProduct];

  if (!activeProduct || !stageProduct || visibleCategories.length === 0) {
    return null;
  }

  return (
    <SectionContainer variant="white" id="shop">
      <div className="relative">
        <div className="absolute left-[8%] top-24 -z-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-0 right-[8%] -z-10 h-72 w-72 rounded-full bg-accent/6 blur-3xl" />

        <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center">
          <div className="mb-20 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-system-background/60 p-1.5 shadow-[0_12px_36px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-3xl dark:bg-white/[0.04] dark:shadow-[0_12px_36px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)]">
              {visibleCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.id);
                    const firstInCategory = productIds.find(
                      (key) => productsById[key].categoryId === category.id
                    );
                    if (firstInCategory) setSelectedProduct(firstInCategory);
                  }}
                  className={cn(
                    "rounded-full px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-500",
                    activeCategory === category.id
                      ? "bg-label text-system-background shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
                      : "text-secondary-label hover:text-label"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <motion.h2
              initial={{ opacity: 0, scale: 0.98, y: 12 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mt-14 text-5xl font-headline font-bold tracking-display text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
            >
              Choose Your Fuel.
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-6xl overflow-hidden rounded-[48px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,242,234,0.95)_100%)] p-4 shadow-[0_80px_160px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.85)] dark:bg-[linear-gradient(180deg,rgba(20,23,20,0.98)_0%,rgba(9,11,9,0.96)_100%)] dark:shadow-[0_80px_160px_rgba(0,0,0,0.48),inset_0_1px_0_rgba(255,255,255,0.06)] md:p-10 lg:p-12"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(215,197,163,0.1),transparent_70%)] opacity-50" />
            
            <div className="relative flex flex-col gap-12 lg:gap-20">
              {/* Central Stage */}
              <div className="relative mx-auto w-full max-w-[900px]">
                <div className="relative isolate aspect-[4/3] lg:aspect-[1.68/1] overflow-visible rounded-[40px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,61,46,0.08),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(215,197,163,0.12),transparent_70%)]" />
                  <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40 blur-[100px] dark:bg-white/5" />
                  <div className="absolute inset-x-20 bottom-10 h-10 rounded-full bg-black/10 blur-[40px] dark:bg-black/40" />
                  
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={safeSelectedProduct}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1.05, y: -20 }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="product-frame relative z-10 flex h-full items-center justify-center"
                    >
                      {stageProduct.model && (scrollActive || !stageProduct.image) ? (
                        <Product3DViewer
                          modelPath={stageProduct.model}
                          theme={isDark ? "dark" : "light"}
                          className="h-full w-full"
                          sectionId={`shop-${safeSelectedProduct}`}
                          scrollActive={scrollActive}
                        />
                      ) : stageProduct.image ? (
                        <Image
                          src={stageProduct.image}
                          alt={stageProduct.name}
                          width={600}
                          height={800}
                          className="h-[90%] w-auto object-contain drop-shadow-[0_45px_120px_rgba(0,0,0,0.3)] animate-float"
                        />
                      ) : (
                        <ProductArtFallback className="h-full w-full" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Floating Action Badge */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-[280px] sm:max-w-md">
                   <div className="glass-morphism rounded-3xl bg-system-background/80 p-4 shadow-float dark:bg-black/60 border-none flex items-center justify-between gap-4">
                      <div className="px-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-secondary-label">Price</div>
                        <div className="text-xl font-bold tracking-tight text-foreground">{formatNgn(pricing.currentNgn)}</div>
                      </div>
                      <Button
                        size="md"
                        className="h-12 px-8 rounded-[18px] text-[11px] font-black uppercase tracking-widest shadow-float"
                        onClick={() => addItem(safeSelectedProduct)}
                      >
                        Add to Cart
                      </Button>
                   </div>
                </div>
              </div>

              {/* Selection & Details: Single Centered Column */}
              <div className="flex flex-col items-center text-center max-w-4xl mx-auto w-full">
                {/* Product Info */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={safeSelectedProduct}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center space-y-10"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex gap-3 justify-center">
                        <span className="inline-flex rounded-full bg-accent/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-accent dark:bg-accent/20">
                          {categoriesById[activeProduct.categoryId]?.name ?? activeProduct.categoryId}
                        </span>
                        {activeIsShot && (
                           <span className="inline-flex rounded-full bg-system-fill px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-secondary-label">
                             {SHOT_BUNDLE.shortLabel}
                           </span>
                        )}
                      </div>
                      <h3 className="mt-8 text-4xl font-headline font-bold tracking-display text-foreground sm:text-5xl lg:text-7xl">
                        {activeProduct.name}
                      </h3>
                      <p className="mt-6 text-lg leading-relaxed tracking-body text-secondary-label font-medium opacity-80 max-w-2xl">
                        {activeProduct.description}
                      </p>
                    </div>

                    {statEntries.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full">
                        {statEntries.map(([statKey, value]) => (
                          <div key={statKey} className="min-w-[140px] rounded-[24px] bg-system-fill/50 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] dark:bg-white/[0.03] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-secondary-label opacity-60">{statKey}</span>
                            <div className="mt-2 text-xl font-bold tracking-tight text-foreground">{value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* More Flavors / Variants */}
                <div className="mt-20 flex flex-col items-center space-y-8 w-full">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-secondary-label opacity-60 text-center">Select Variant</div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {filteredProducts.map((key) => {
                      const product = productsById[key];
                      const isSelected = safeSelectedProduct === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedProduct(key)}
                          className={cn(
                            "group relative flex flex-col items-center rounded-3xl p-5 transition-all duration-700 min-w-[120px]",
                            isSelected
                              ? "bg-label text-system-background shadow-float scale-[1.05]"
                              : "bg-system-background/40 hover:bg-system-background/80 hover:-translate-y-1 dark:bg-white/[0.02] dark:hover:bg-white/[0.05]"
                          )}
                        >
                          <div className={cn(
                            "mb-3 flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-500",
                            isSelected ? "bg-white/10" : "bg-system-fill dark:bg-white/[0.03]"
                          )}>
                            <Image 
                              src={product.image || ""} 
                              alt={product.name} 
                              width={70} 
                              height={70} 
                              className="h-[80%] w-auto object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-700" 
                            />
                          </div>
                          <div className={cn(
                            "text-[9px] font-bold uppercase tracking-widest text-center truncate px-2",
                            isSelected ? "text-system-background" : "text-label"
                          )}>
                            {product.flavor || product.name}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </SectionContainer>
  );
}
