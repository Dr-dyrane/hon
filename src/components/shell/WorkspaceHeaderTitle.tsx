"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  getShellHeaderContext,
  type ShellHeaderRoute,
  type ShellNavItem,
} from "@/lib/app-shell";
import { cn } from "@/lib/utils";

export function WorkspaceHeaderTitle({
  eyebrow,
  title,
  navItems,
  routes,
}: {
  eyebrow: string;
  title: string;
  navItems: ShellNavItem[];
  routes: ShellHeaderRoute[];
}) {
  const pathname = usePathname();
  const context = getShellHeaderContext({
    pathname,
    navItems,
    routes,
    fallbackTitle: title,
  });

  return (
    <div className="min-w-0">
      {context.breadcrumbs.length > 0 ? (
        <nav
          aria-label="Breadcrumb"
          className="scrollbar-hide flex items-center gap-1 overflow-x-auto text-[10px] font-semibold uppercase tracking-headline text-secondary-label"
        >
          {context.breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.href} className="flex items-center gap-1 shrink-0">
              {index > 0 ? <ChevronRight size={12} className="text-tertiary-label" /> : null}
              <Link
                href={breadcrumb.href}
                className={cn(
                  "rounded-full px-1.5 py-0.5 transition-colors duration-200",
                  "hover:bg-system-fill/60 hover:text-label"
                )}
              >
                {breadcrumb.label}
              </Link>
            </div>
          ))}
        </nav>
      ) : (
        <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          {eyebrow}
        </div>
      )}

      <div className="mt-1 truncate text-xl font-semibold tracking-title text-label md:text-2xl">
        {context.title}
      </div>
    </div>
  );
}
