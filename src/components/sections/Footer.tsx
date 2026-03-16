"use client";

import React from "react";
import { motion } from "framer-motion";
import { BRAND } from "@/lib/data";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const links = [
  { name: "Shop", href: "#shop" },
  { name: "System", href: "#solution" },
  { name: "Ingredients", href: "#ingredients" },
  { name: "Benefits", href: "#benefits" },
  { name: "Reviews", href: "#social" }
];

export function Footer() {
  return (
    <footer className="relative bg-surface py-24 md:py-32 px-6 overflow-hidden">
      {/* Subtle top border gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-soft to-transparent" />
      
      <div className="container-shell flex flex-col items-center">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Logo />
        </motion.div>
        
        {/* Navigation Links */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-x-10 gap-y-4 mb-16"
        >
          {links.map((link, i) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.4 }}
            >
              <Link 
                href={link.href}
                className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted/50 hover:text-accent transition-colors duration-300"
              >
                {link.name}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-12 h-px bg-border-strong mb-12"
        />

        {/* Copyright & Tagline */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-muted/25">
            &copy; {new Date().getFullYear()} {BRAND.name}. Designed for Performance.
          </p>
          <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-accent/40">
            Premium Plant-Based Nutrition
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
