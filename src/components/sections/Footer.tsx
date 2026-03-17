"use client";

import React from "react";
import { BRAND } from "@/lib/data";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const links = [
    { name: "Shop", href: "#shop" },
    { name: "System", href: "#solution" },
    { name: "Ingredients", href: "#ingredients" },
    { name: "Benefits", href: "#benefits" },
    { name: "Reviews", href: "#social" }
  ];

  return (
    <footer className="relative surface py-32 px-6" id="footer">
      <div className="container-shell flex flex-col items-center">
        <div className="mb-16">
          <Logo />
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-20">
          {links.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label opacity-60 hover:text-accent transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="text-[9px] font-semibold uppercase tracking-tightest text-secondary-label opacity-20">
            © {new Date().getFullYear()} {BRAND.name}. Designed for Performance.
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-tightest text-accent opacity-40">
            Premium Plant-Based Nutrition
          </div>
        </div>
      </div>
    </footer>
  );
}

