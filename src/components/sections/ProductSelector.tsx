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

        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center">
          <div className="max-w-3xl text-center">
            <motion.h2
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl font-headline font-bold tracking-display text-foreground md:text-5xl lg:text-6xl"
            >
              Choose Your Fuel.
            </motion.h2>

            <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-system-background/75 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-2xl dark:bg-[rgba(18,20,18,0.78)] dark:shadow-[0_24px_70px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]">
              {visibleCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.id);

                    const firstInCategory = productIds.find(
                      (key) => productsById[key].categoryId === category.id
                    );

                    if (firstInCategory) {
                      setSelectedProduct(firstInCategory);
                    }
                  }}
                  className={cn(
                    "rounded-full px-5 py-3 text-[10px] font-semibold uppercase tracking-headline transition-all duration-500 sm:px-6",
                    activeCategory === category.id
                      ? "bg-label text-system-background shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                      : "text-secondary-label hover:bg-system-fill hover:text-label"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-14 w-full overflow-hidden rounded-[40px] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,242,234,0.92)_100%)] p-2 shadow-[0_40px_120px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.84)] dark:bg-[linear-gradient(180deg,rgba(20,23,20,0.96)_0%,rgba(9,11,9,0.94)_100%)] dark:shadow-[0_40px_120px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-6 lg:p-8"
          >
            <div className="absolute -left-10 top-16 h-44 w-44 rounded-full bg-accent/12 blur-3xl dark:bg-accent/10" />
            <div className="absolute -right-8 bottom-16 h-52 w-52 rounded-full bg-black/6 blur-3xl dark:bg-white/6" />

            <div className="relative grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)_380px] xl:items-start">
              <div className="order-2 xl:order-1">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {filteredProducts.map((key) => {
                    const product = productsById[key];
                    const productFlavor = getProductFlavor(product);
                    const isSelected = safeSelectedProduct === key;
                    const cardPricing = getProductPriceSnapshot(productsById, key);

                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedProduct(key)}
                        className={cn(
                          "group relative overflow-hidden rounded-[28px] p-3 text-left transition-all duration-500 sm:p-4",
                          isSelected
                            ? "bg-label text-system-background shadow-[0_28px_80px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]"
                            : "bg-system-background/70 shadow-[0_14px_40px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.78)] hover:-translate-y-1 hover:bg-system-background/90 dark:bg-white/[0.03] dark:shadow-[0_18px_48px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.04)] dark:hover:bg-white/[0.05]"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute inset-0 opacity-0 transition-opacity duration-500",
                            isSelected
                              ? "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_55%)] opacity-100"
                              : "bg-[radial-gradient(circle_at_top_right,rgba(15,61,46,0.08),transparent_55%)] group-hover:opacity-100 dark:bg-[radial-gradient(circle_at_top_right,rgba(215,197,163,0.12),transparent_55%)]"
                          )}
                        />

                        <div className="relative flex items-center gap-4">
                          <div
                            className={cn(
                              "flex h-20 w-20 shrink-0 items-center justify-center rounded-[22px] p-2",
                              isSelected
                                ? "bg-white/8 dark:bg-black/8  shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                                : "bg-system-fill shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                            )}
                          >
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={88}
                                height={88}
                                className="h-full w-full object-contain drop-shadow-xl"
                              />
                            ) : (
                              <ProductArtFallback className="h-full w-full" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div
                              className={cn(
                                "text-[10px] font-semibold uppercase tracking-headline",
                                isSelected
                                  ? "text-system-background/55"
                                  : "text-secondary-label"
                              )}
                            >
                              {categoriesById[product.categoryId]?.name ?? product.categoryId}
                            </div>

                            <div className="mt-1 text-xl font-headline font-semibold tracking-title">
                              {productFlavor || product.name}
                            </div>

                            {productFlavor ? (
                              <div
                                className={cn(
                                  "mt-1 text-sm",
                                  isSelected
                                    ? "text-system-background/72"
                                    : "text-secondary-label"
                                )}
                              >
                                {product.name}
                              </div>
                            ) : null}

                            <div
                              className={cn(
                                "mt-3 flex flex-wrap items-center gap-2 text-sm tracking-tight",
                                isSelected ? "text-system-background" : "text-label"
                              )}
                            >
                              <span className="font-semibold">
                                {formatNgn(cardPricing.currentNgn)}
                              </span>
                            </div>
                          </div>

                          <div
                            aria-hidden
                            className={cn(
                              "h-3 w-3 rounded-full transition-all duration-500",
                              isSelected
                                ? "bg-system-background shadow-[0_0_0_6px_rgba(255,255,255,0.12)]"
                                : "bg-quaternary-label/70 group-hover:bg-secondary-label"
                            )}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="order-1 xl:order-2">
                <div className="relative isolate h-[460px] overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(241,236,226,0.84)_58%,rgba(229,222,208,0.68)_100%)] shadow-[0_24px_80px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.84)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),rgba(14,17,14,0.92)_58%,rgba(8,10,8,0.98)_100%)] dark:shadow-[0_28px_90px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] sm:h-[540px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,61,46,0.10),transparent_65%)] dark:bg-[radial-gradient(circle_at_center,rgba(215,197,163,0.12),transparent_70%)]" />
                  <div className="absolute left-1/2 top-14 h-48 w-48 -translate-x-1/2 rounded-full bg-white/80 blur-3xl dark:bg-white/10" />
                  <div className="absolute inset-x-8 bottom-5 h-12 rounded-full bg-black/10 blur-2xl dark:bg-black/50" />
                  <div className="stage-light !top-[46%] !scale-90 !opacity-50" />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={safeSelectedProduct}
                      initial={{ opacity: 0, scale: 0.92, y: 16, rotateY: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
                      exit={{ opacity: 0, scale: 1.04, y: -8, rotateY: 10 }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="product-frame relative z-10 flex h-full items-center justify-center px-2 sm:px-5"
                    >
                      {stageProduct.model && scrollActive ? (
                        <Product3DViewer
                          modelPath={stageProduct.model}
                          theme={isDark ? "dark" : "light"}
                          className="h-full w-full max-w-[360px]"
                          sectionId={`shop-${safeSelectedProduct}`}
                          scrollActive={scrollActive}
                        />
                      ) : stageProduct.image ? (
                        <Image
                          src={stageProduct.image}
                          alt={stageProduct.name}
                          width={560}
                          height={720}
                          className="h-auto w-full max-w-[360px] drop-shadow-[0_28px_80px_rgba(0,0,0,0.24)] animate-float"
                        />
                      ) : (
                        <ProductArtFallback className="h-full w-full" />
                      )}
                    </motion.div>
                  </AnimatePresence>

                  <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 sm:inset-x-6 sm:bottom-6">
                    <div className="pointer-events-auto glass-morphism squircle flex flex-col gap-4 bg-system-background/74 p-3 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:bg-[rgba(12,14,12,0.72)] sm:flex-row sm:items-center sm:justify-between sm:p-4">
                      <div className="min-w-0">
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-lg font-semibold tracking-tight text-label sm:text-xl">
                            {formatNgn(pricing.currentNgn)}
                          </span>
                        </div>
                      </div>

                      <div className="flex sm:justify-end">
                        <Button
                          size="md"
                          className="!h-[44px] px-5 text-[10px] font-semibold uppercase tracking-headline"
                          onClick={() => addItem(safeSelectedProduct)}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={safeSelectedProduct}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col rounded-[32px] bg-system-background/60 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-2xl dark:bg-white/[0.04] dark:shadow-[0_28px_90px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-7"
                  >
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex w-fit rounded-full bg-accent/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-accent dark:bg-accent/15">
                        {categoriesById[activeProduct.categoryId]?.name ??
                          activeProduct.categoryId}
                      </span>
                      {activeIsShot ? (
                        <span className="inline-flex w-fit rounded-full bg-system-fill px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                          {SHOT_BUNDLE.shortLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-6 space-y-4">
                      <h3 className="text-4xl font-headline font-bold tracking-display text-foreground md:text-5xl xl:text-[3.25rem]">
                        {activeProduct.name}
                      </h3>

                      <p className="text-base leading-relaxed tracking-body text-secondary-label sm:text-lg">
                        {activeProduct.description}
                      </p>
                    </div>

                    <div className="mt-8 rounded-[28px] bg-system-fill/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:bg-white/[0.03] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                            Price
                          </p>
                          <div className="mt-3 text-4xl font-bold tracking-tight text-label">
                            {formatNgn(pricing.currentNgn)}
                          </div>
                        </div>

                        {activeIsShot ? (
                          <div className="rounded-full bg-accent/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-accent dark:bg-accent/15">
                            {SHOT_BUNDLE.shortLabel}
                          </div>
                        ) : null}
                      </div>

                      {activeIsShot ? (
                        <p className="mt-4 text-sm leading-relaxed tracking-body text-secondary-label">
                          {SHOT_BUNDLE.unitCount} shots,{" "}
                          {formatNgn(SHOT_BUNDLE.bundlePriceNgn)}.
                        </p>
                      ) : (
                        <p className="mt-4 text-sm leading-relaxed tracking-body text-secondary-label">
                          Single unit.
                        </p>
                      )}
                    </div>

                    {statEntries.length > 0 ? (
                      <div
                        className={cn(
                          "mt-8 grid gap-3",
                          statEntries.length > 2 ? "grid-cols-3" : "grid-cols-2"
                        )}
                      >
                        {statEntries.map(([statKey, value]) => (
                          <div
                            key={statKey}
                            className="rounded-[24px] bg-system-fill/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:bg-white/[0.03] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                          >
                            <span className="text-[8px] font-semibold uppercase tracking-headline text-secondary-label">
                              {statKey}
                            </span>
                            <div className="mt-2 text-lg font-bold tracking-tight text-label">
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className={cn("mt-auto", statEntries.length > 0 ? "pt-6" : "pt-8")} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </SectionContainer>
  );
}
