"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveShellPath, type ShellNavItem } from "@/lib/app-shell";
import { cn } from "@/lib/utils";

export function WorkspaceNav({
  items,
  mode = "sidebar",
}: {
  items: ShellNavItem[];
  mode?: "sidebar" | "mobile";
}) {
  const pathname = usePathname();
  const mobileFrameClass =
    process.env.NODE_ENV === "development"
      ? "left-[4.5rem] right-4"
      : "inset-x-4";

  if (mode === "mobile") {
    return (
      <nav
        aria-label="Section navigation"
        className={cn(
          "glass-morphism fixed bottom-4 z-40 rounded-[28px] bg-system-background/84 p-2 shadow-[0_20px_60px_rgba(15,23,42,0.12)] md:hidden",
          mobileFrameClass
        )}
      >
        <ul className="scrollbar-hide flex gap-1 overflow-x-auto">
          {items.map((item) => {
            const active = isActiveShellPath(pathname, item);

            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  className={cn(
                    "flex min-h-[52px] items-center justify-center rounded-[20px] px-4 text-[11px] font-semibold tracking-headline whitespace-nowrap transition-all duration-200",
                    active
                      ? "bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
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
        const active = isActiveShellPath(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-[28px] px-4 py-4 transition-all duration-200",
              active
                ? "bg-[var(--accent)] text-[var(--accent-label)] shadow-button"
                : "glass-morphism bg-system-fill/56 text-label hover:bg-system-fill/76"
            )}
          >
            <div
              className={cn(
                "text-sm font-semibold tracking-tight",
                active ? "text-[var(--accent-label)]" : "text-label"
              )}
            >
              {item.label}
            </div>
            <p
              style={
                active
                  ? {
                      color: "var(--accent-label)",
                      opacity: 0.82,
                    }
                  : undefined
              }
              className={cn(
                "mt-1 text-xs leading-relaxed",
                active ? "" : "text-secondary-label"
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
