import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { redirectAuthenticatedUserFromAuth } from "@/lib/auth/guards";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  await redirectAuthenticatedUserFromAuth();

  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(15,61,46,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,242,234,0.9)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(215,197,163,0.08),transparent_38%),linear-gradient(180deg,rgba(18,22,18,0.98)_0%,rgba(10,12,10,1)_100%)]">
      <header className="container-shell flex items-center justify-between px-1 py-6">
        <Link href="/" className="inline-flex">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="container-shell flex min-h-[calc(100svh-92px)] items-center justify-center px-1 pb-12">
        <div className="w-full max-w-[560px]">{children}</div>
      </main>
    </div>
  );
}
