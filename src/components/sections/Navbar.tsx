"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Equal, X } from "lucide-react";
import { NAVIGATION } from "@/lib/data";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = React.useRef(0);

  // Smart hide/show on scroll
  useMotionValueEvent(scrollY, "change", (latest) => {
    const direction = latest > lastScrollY.current ? "down" : "up";
    
    if (latest > 100) {
      setIsScrolled(true);
      // Hide on scroll down, show on scroll up
      if (direction === "down" && latest > 200) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    } else {
      setIsScrolled(false);
      setIsVisible(true);
    }
    
    lastScrollY.current = latest;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: isVisible ? 0 : -100, 
          opacity: isVisible ? 1 : 0 
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "py-3"
            : "py-5"
        )}
      >
        {/* Glass background - only when scrolled */}
        <motion.div
          initial={false}
          animate={{ 
            opacity: isScrolled ? 1 : 0,
            backdropFilter: isScrolled ? "blur(20px) saturate(180%)" : "blur(0px)",
          }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-background/70 border-b border-border-soft/50"
          style={{ WebkitBackdropFilter: isScrolled ? "blur(20px) saturate(180%)" : "blur(0px)" }}
        />

        <div className="container-shell flex items-center justify-between relative">
          {/* Logo */}
          <motion.div 
            className="flex w-auto md:w-1/4"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/" className="z-50 shrink-0">
              <Logo />
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-center gap-8 w-1/2">
            {NAVIGATION.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.4 }}
              >
                <Link
                  href={item.href}
                  className="relative text-[12px] font-medium tracking-[0.05em] text-muted hover:text-foreground transition-colors duration-300 py-2 group"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-accent group-hover:w-full transition-all duration-300 ease-out" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-4 w-auto md:w-1/4">
            <motion.div 
              className="hidden md:flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <ThemeToggle />
            </motion.div>
            
            <AnimatePresence mode="wait">
              {isScrolled && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: "auto" }}
                  exit={{ opacity: 0, scale: 0.9, width: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden hidden md:flex"
                >
                  <Link
                    href="#shop"
                    className="inline-flex items-center justify-center h-9 px-5 text-[11px] font-semibold tracking-wide rounded-full bg-accent text-accent-foreground shadow-button hover:shadow-float hover:scale-105 transition-all duration-300 whitespace-nowrap"
                  >
                    Order Now
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="md:hidden relative z-50 h-10 w-10 flex items-center justify-center rounded-full hover:bg-surface transition-colors"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isMobileMenuOpen ? "close" : "menu"}
                  initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  ) : (
                    <Equal className="w-5 h-5 text-foreground" strokeWidth={1.5} />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu - Full screen overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background"
            />

            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative flex flex-col justify-center min-h-screen px-8"
            >
              <nav className="flex flex-col">
                {NAVIGATION.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.05 + index * 0.05,
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="group flex items-center py-4"
                    >
                      <span className="text-4xl font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors duration-300">
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
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.05 + NAVIGATION.length * 0.05,
                }}
                className="mt-12 flex flex-col gap-6"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-muted">Theme</span>
                  <ThemeToggle />
                </div>

                <Link
                  href="#shop"
                  onClick={closeMobileMenu}
                  className="button-primary w-full justify-center min-h-[56px] text-sm font-semibold"
                >
                  Start Your Order
                </Link>
              </motion.div>

              {/* Decorative element */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-12 left-8 text-[10px] font-medium tracking-[0.2em] text-muted/30 uppercase"
              >
                House of Prax
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
