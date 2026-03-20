import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { ADMIN_NAV_ITEMS } from "@/lib/app-shell";
import { requireAdminSession } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession("/admin");

  return (
    <WorkspaceShell
      eyebrow="Operations Console"
      title="Admin"
      description="Orders, payments, delivery, merchandising, and customer support now have a dedicated shell."
      navItems={ADMIN_NAV_ITEMS}
      sessionEmail={session.email}
      sessionRoleLabel="Administrator"
    >
      {children}
    </WorkspaceShell>
  );
}
