"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-12 h-6" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center w-12 h-6 p-1 rounded-full bg-border-strong transition-colors duration-300 ease-in-out outline-none border-none focus:outline-none focus-visible:ring-0"
      aria-label="Toggle theme"
    >
      <motion.div
        className="flex items-center justify-center w-4 h-4 rounded-full bg-background shadow-sm transform-gpu text-foreground"
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <Moon size={10} strokeWidth={2.5} />
        ) : (
          <Sun size={10} strokeWidth={2.5} />
        )}
      </motion.div>
    </button>
  );
}
