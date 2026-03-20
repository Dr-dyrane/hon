"use client";

import { usePathname } from "next/navigation";
import type { ShellNavItem } from "@/lib/app-shell";

function isActivePath(currentPath: string, item: ShellNavItem) {
  if (item.href === currentPath) {
    return true;
  }

  if (item.match === "exact") {
    return false;
  }

  return currentPath.startsWith(`${item.href}/`);
}

export function WorkspaceHeaderTitle({
  title,
  navItems,
}: {
  title: string;
  navItems: ShellNavItem[];
}) {
  const pathname = usePathname();
  const activeItem = navItems.find((item) => isActivePath(pathname, item));

  return <>{activeItem?.label ?? title}</>;
}
