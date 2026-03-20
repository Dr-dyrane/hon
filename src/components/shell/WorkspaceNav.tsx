"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ShellNavItem } from "@/lib/app-shell";
import { cn } from "@/lib/utils";

function isActivePath(currentPath: string, item: ShellNavItem) {
  if (item.href === currentPath) {
    return true;
  }

  if (item.match === "exact") {
    return false;
  }

  return currentPath.startsWith(`${item.href}/`);
}

export function WorkspaceNav({
  items,
  mode = "sidebar",
}: {
  items: ShellNavItem[];
  mode?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();

  if (mode === "mobile") {
    return (
      <nav
        aria-label="Section navigation"
        className="glass-morphism fixed inset-x-4 bottom-4 z-40 rounded-[28px] bg-system-background/84 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] md:hidden"
      >
        <ul className="scrollbar-hide flex gap-1 overflow-x-auto">
          {items.map((item) => {
            const active = isActivePath(pathname, item);

            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-[52px] items-center justify-center rounded-[20px] px-4 text-[11px] font-semibold tracking-headline whitespace-nowrap transition-all duration-200",
                    active
                      ? "bg-system-background text-label shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
                      : "text-secondary-label hover:bg-system-fill/80 hover:text-label"
                  )}
                >
                  {item.shortLabel}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Section navigation" className="space-y-2">
      {items.map((item) => {
        const active = isActivePath(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "glass-morphism block rounded-[28px] px-4 py-4 transition-all duration-200",
              active
                ? "bg-system-background text-label shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                : "bg-system-fill/56 text-label hover:bg-system-fill/76"
            )}
          >
            <div className="text-sm font-semibold tracking-tight">{item.label}</div>
            <p
              className={cn(
                "mt-1 text-xs leading-relaxed",
                "text-secondary-label"
              )}
            >
              {item.description}
            </p>
          </Link>
        );
      })}
    </nav>
  );
}
