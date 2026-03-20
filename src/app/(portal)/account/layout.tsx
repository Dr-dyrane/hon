import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { PORTAL_HEADER_ROUTES, PORTAL_NAV_ITEMS } from "@/lib/app-shell";
import { requireAuthenticatedSession } from "@/lib/auth/guards";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await requireAuthenticatedSession("/account");

  return (
    <WorkspaceShell
      eyebrow="Customer Portal"
      title="Account"
      description="Orders, delivery tracking, saved addresses, and reorder tools live here."
      navItems={PORTAL_NAV_ITEMS}
      headerRoutes={PORTAL_HEADER_ROUTES}
      mobileNav
      sessionEmail={session.email}
      sessionRoleLabel="Signed in"
    >
      {children}
    </WorkspaceShell>
  );
}
