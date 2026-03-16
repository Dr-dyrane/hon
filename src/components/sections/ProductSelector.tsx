"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { CATEGORIES, PRODUCTS } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Product3DViewer } from "@/components/3d/Product3DViewer";
import { useScrollAware3D } from "@/hooks/useScrollAware3D";

export function ProductSelector() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [selectedProduct, setSelectedProduct] = useState<keyof typeof PRODUCTS>("protein_chocolate");
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" });

  const { isScrollingIntoSection } = useScrollAware3D({
    sectionIds: ["hero", "solution", "shop"],
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleCheckout = (prodKey: keyof typeof PRODUCTS) => {
    const product = PRODUCTS[prodKey] as any;
    const phoneNumber = "+2348060785487";
    const text = `Hello House of Prax, I'd like to order the ${product.name}${product.flavor ? ` (${product.flavor})` : ''} ($${product.price}). Please let me know the next steps.`;
    window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const filteredProducts = Object.keys(PRODUCTS).filter(
    (key) => PRODUCTS[key as keyof typeof PRODUCTS].category === activeCategory
  );

  return (
    <SectionContainer variant="white" id="shop" className="relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] rounded-full bg-accent/[0.03] blur-[150px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-headline text-foreground"
          >
            Choose Your Fuel.
          </motion.h2>
          
          {/* Category Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  const firstInCat = Object.keys(PRODUCTS).find(k => PRODUCTS[k as keyof typeof PRODUCTS].category === cat.id);
                  if (firstInCat) setSelectedProduct(firstInCat as any);
                }}
                className={cn(
                  "px-5 py-2 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-300",
                  activeCategory === cat.id 
                    ? "bg-accent text-accent-foreground shadow-button" 
                    : "bg-surface text-muted hover:text-foreground hover:bg-surface-alt"
                )}
              >
                {cat.name}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Product Display */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 w-full max-w-6xl">
          
          {/* Product Toggles - Left */}
          <div className="flex flex-row lg:flex-col gap-3 order-2 lg:order-1 overflow-x-auto lg:overflow-visible scrollbar-hide w-full lg:w-auto px-4 lg:px-0">
            {filteredProducts.map((key) => {
              const prod = PRODUCTS[key as keyof typeof PRODUCTS] as any;
              return (
                <motion.button
                  key={key}
                  onClick={() => setSelectedProduct(key as any)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex-shrink-0 px-6 py-4 rounded-2xl transition-all duration-400 text-left min-w-[140px] lg:min-w-[180px]",
                    selectedProduct === key 
                      ? "bg-foreground text-background shadow-float" 
                      : "bg-surface/60 hover:bg-surface hover:shadow-soft"
                  )}
                >
                  <div className={cn(
                    "text-[9px] font-semibold uppercase tracking-widest mb-1",
                    selectedProduct === key ? "text-background/50" : "text-muted/50"
                  )}>
                    {prod.category}
                  </div>
                  <div className="text-lg font-semibold tracking-tight">
                    {prod.flavor || prod.name}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Product Stage - Center */}
          <div className="relative w-full max-w-sm h-[400px] lg:h-[500px] flex items-center justify-center order-1 lg:order-2 perspective-2000">
            {/* Ambient glow */}
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.15, 0.25, 0.15]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-[60%] h-[60%] rounded-full bg-accent/20 blur-[80px]" />
            </motion.div>
             
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedProduct}
                initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 1.05, rotateY: 10 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="product-frame relative z-10 w-full h-full flex justify-center preserve-3d"
              >
                {(PRODUCTS[selectedProduct as keyof typeof PRODUCTS] as any).model ? (
                  <Product3DViewer
                    modelPath={(PRODUCTS[selectedProduct as keyof typeof PRODUCTS] as any).model}
                    theme={isDark ? "dark" : "light"}
                    className="w-[85%] h-full max-w-[280px]"
                    sectionId="shop"
                    scrollActive={isScrollingIntoSection("shop")}
                  />
                ) : (
                  <Image 
                    src={PRODUCTS[selectedProduct as keyof typeof PRODUCTS].image} 
                    alt={selectedProduct.toString()}
                    width={400}
                    height={500}
                    className="w-[75%] h-auto max-w-[260px] drop-shadow-2xl animate-float"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Product Details - Right */}
          <div className="flex-1 order-3 text-center lg:text-left max-w-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedProduct}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Badge */}
                <span className="inline-block text-[9px] font-semibold uppercase tracking-[0.15em] text-accent px-4 py-2 bg-accent/10 rounded-full mb-8">
                  Premium Quality
                </span>
                
                {/* Product Name */}
                <h3 className="text-title text-foreground">
                  {PRODUCTS[selectedProduct as keyof typeof PRODUCTS].name}
                </h3>
                
                {/* Description */}
                <p className="mt-5 text-muted leading-relaxed">
                  {PRODUCTS[selectedProduct as keyof typeof PRODUCTS].description}
                </p>
                
                {/* Stats */}
                {(PRODUCTS[selectedProduct as keyof typeof PRODUCTS] as any).stats && (
                  <div className="mt-8 flex flex-wrap gap-6 justify-center lg:justify-start">
                    {Object.entries((PRODUCTS[selectedProduct as keyof typeof PRODUCTS] as any).stats).map(([statKey, val]: [string, any]) => (
                      <div key={statKey} className="flex flex-col">
                        <span className="text-[8px] font-semibold uppercase tracking-widest text-muted/50">{statKey}</span>
                        <span className="text-lg font-bold text-foreground">{val}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price & CTA */}
                <div className="mt-10 pt-8 border-t border-border-soft">
                  <div className="flex items-baseline gap-2 mb-6 justify-center lg:justify-start">
                    <span className="text-4xl font-bold text-foreground">
                      ${Math.floor(PRODUCTS[selectedProduct as keyof typeof PRODUCTS].price)}.
                    </span>
                    <span className="text-xl font-semibold text-foreground">
                      {(PRODUCTS[selectedProduct as keyof typeof PRODUCTS].price % 1).toFixed(2).split('.')[1]}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/40 ml-2">
                      Per Unit
                    </span>
                  </div>
                  
                  <Button 
                    size="lg" 
                    className="w-full min-h-[56px] rounded-2xl text-sm font-semibold"
                    onClick={() => handleCheckout(selectedProduct as any)}
                  >
                    Order via WhatsApp
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
