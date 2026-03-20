import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { WorkspaceNav } from "@/components/shell/WorkspaceNav";
import type { ShellNavItem } from "@/lib/app-shell";

export function WorkspaceShell({
  eyebrow,
  title,
  description,
  navItems,
  children,
  mobileNav = false,
  sessionEmail,
  sessionRoleLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  navItems: ShellNavItem[];
  children: ReactNode;
  mobileNav?: boolean;
  sessionEmail?: string;
  sessionRoleLabel?: string;
}) {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(15,61,46,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,242,234,0.9)_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(215,197,163,0.09),transparent_38%),linear-gradient(180deg,rgba(18,22,18,0.98)_0%,rgba(10,12,10,1)_100%)]">
      <div className="mx-auto min-h-svh max-w-[1600px] md:grid md:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden bg-system-background/48 px-6 py-6 md:flex md:flex-col">
          <Link href="/" className="inline-flex">
            <Logo />
          </Link>

          <div className="mt-10">
            <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              {eyebrow}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-display text-label">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-secondary-label">
              {description}
            </p>
          </div>

          <div className="mt-10 flex-1">
            <WorkspaceNav items={navItems} />
          </div>

          <div className="glass-morphism rounded-[24px] bg-system-fill/56 px-4 py-3 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                  {sessionRoleLabel ?? "Appearance"}
                </div>
                <div className="mt-1 text-sm font-medium text-label">
                  {sessionEmail ?? "Theme"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {sessionEmail ? <SignOutButton /> : null}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 px-4 pt-4 md:px-6 md:pt-6">
            <div className="glass-morphism rounded-[30px] bg-system-background/78 px-5 py-4 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label md:hidden">
                    {eyebrow}
                  </div>
                  <div className="mt-1 text-xl font-semibold tracking-title text-label md:text-2xl">
                    {title}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href="/"
                    className="hidden rounded-full bg-system-fill/72 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-200 hover:bg-system-fill hover:text-label sm:inline-flex"
                  >
                    Back to site
                  </Link>
                  {sessionEmail ? <div className="md:hidden"><SignOutButton /></div> : null}
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>

          <main className="container-shell px-1 pb-28 pt-6 md:px-0 md:pb-12 md:pt-8">
            {children}
          </main>
        </div>
      </div>

      {mobileNav ? <WorkspaceNav items={navItems} mode="mobile" /> : null}
    </div>
  );
}
