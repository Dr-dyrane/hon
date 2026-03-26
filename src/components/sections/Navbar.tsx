"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Equal, ShoppingBag, X } from "lucide-react";
import { useMarketingContent } from "@/components/providers/MarketingContentProvider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useUI } from "@/components/providers/UIProvider";
import { useCommerce } from "@/components/providers/CommerceProvider";

export function Navbar() {
  const { navigation } = useMarketingContent();
  const [isScrolled, setIsScrolled] = useState(false);
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useUI();
  const { itemCount, openCart } = useCommerce();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const handleOpenCart = () => {
    setIsMobileMenuOpen(false);
    openCart();
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "py-3 backdrop-blur-sm"
            : "py-6 bg-transparent"
        )}
      >
        <div className="container-shell flex items-center justify-between relative">
          {/* Logo */}
          <div className="flex w-auto md:w-1/4">
            <Link href="/" className="z-50 shrink-0">
              <Logo />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8 w-1/2">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[12px] font-semibold uppercase tracking-headline text-secondary-label opacity-80 hover:text-label transition-colors duration-300 vibrancy-label"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-2 md:gap-3 w-auto md:w-1/4">
            <div className="hidden md:flex">
              <ThemeToggle />
            </div>

            <Link
              href="/account"
              className="hidden md:inline-flex items-center text-[11px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
            >
              Account
            </Link>

            <button
              type="button"
              onClick={handleOpenCart}
              className="group relative hidden md:inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-300 hover:text-label"
              aria-label={`Open cart${itemCount > 0 ? ` with ${itemCount} items` : ""}`}
            >
              <ShoppingBag
                className="h-[16px] w-[16px] transition-transform duration-300 group-hover:-translate-y-px"
                strokeWidth={1.7}
              />
              {itemCount > 0 ? (
                <span className="text-label">
                  {itemCount}
                </span>
              ) : null}
            </button>

            <AnimatePresence initial={false}>
              {isScrolled && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="hidden md:flex items-center"
                >
                  <Link
                    href="#shop"
                    className="hidden md:inline-flex items-center justify-center button-primary !h-[32px] !min-h-[32px] px-6 text-[9px] font-semibold uppercase tracking-headline rounded-full whitespace-nowrap transition-transform shadow-none"
                  >
                    Shop Products
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleOpenCart}
              className="relative mr-1 flex h-10 items-center justify-center text-label md:hidden"
              aria-label={`Open cart${itemCount > 0 ? ` with ${itemCount} items` : ""}`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {itemCount > 0 ? (
                <span className="absolute -right-1 -top-1 text-[10px] font-semibold text-label">
                  {itemCount}
                </span>
              ) : null}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="md:hidden relative z-50 h-10 w-10 flex items-center justify-center"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isMobileMenuOpen ? "close" : "menu"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 text-label" strokeWidth={1.5} />
                  ) : (
                    <Equal className="w-5 h-5 text-label" strokeWidth={1.5} />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-system-background"
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative flex flex-col justify-center min-h-screen px-8"
            >
              <nav className="flex flex-col">
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.1 + index * 0.06,
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="group flex items-center py-5"
                    >
                      <span className="text-4xl font-semibold tracking-tight text-label group-hover:text-accent transition-colors duration-300">
                        {item.label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.1 + navigation.length * 0.06,
                }}
                className="mt-12 flex flex-col gap-8"
              >
                <div className="flex items-center justify-between px-2">
                  <span className="text-xl font-medium text-secondary-label vibrancy-label">
                    Appearance
                  </span>
                  <ThemeToggle />
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="#shop"
                    onClick={closeMobileMenu}
                    className="button-primary w-full justify-center min-h-[56px] text-xs font-semibold uppercase tracking-headline"
                  >
                    Shop Products
                  </Link>

                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="button-secondary w-full justify-center min-h-[56px] text-xs font-semibold uppercase tracking-headline"
                  >
                    Account
                  </Link>

                  <button
                    type="button"
                    onClick={handleOpenCart}
                    className="button-secondary w-full justify-center min-h-[56px] text-xs font-semibold uppercase tracking-headline"
                  >
                    Cart {itemCount > 0 ? `(${itemCount})` : ""}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
