import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "House of Prax | Engineering Elite Human Performance",
  description: "Advanced plant-based nutrition designed for high-performance longevity. Zero fillers. Pure power. The standard for the modern athlete.",
  keywords: ["plant protein", "vegan performance", "clean fuel", "house of prax", "elite nutrition", "gym recovery", "gut health protein"],
  authors: [{ name: "House of Prax" }],
  metadataBase: new URL("https://houseofprax.shop"),
  openGraph: {
    title: "House of Prax | Pure Performance Nutriton",
    description: "Upgrade your foundation. Clean, plant-powered fuel for real training.",
    url: "https://houseofprax.shop",
    siteName: "House of Prax",
    images: [
      {
        url: "/images/prax_brand.png",
        width: 1200,
        height: 630,
        alt: "House of Prax - Elite Nutrition",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "House of Prax | Elite Plant Protein",
    description: "The standard for modern athletic nutrition. Zero compromises.",
    images: ["/images/prax_brand.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F2EA" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
};

import { ThemeProvider } from "@/components/providers/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
