import { ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { AdminSettingsSectionNav } from "@/components/admin/settings/AdminSettingsSectionNav";
import { AdminTeamManager } from "@/components/admin/settings/AdminTeamManager";
import { requireAdminSession } from "@/lib/auth/guards";
import { listAdminUsers } from "@/lib/db/repositories/admin-user-repository";

export default async function AdminSettingsTeamPage() {
  const session = await requireAdminSession("/admin/settings/team");
  const users = await listAdminUsers(50, session.email);
  const adminCount = users.filter((user) => user.isAdmin).length;
  const activeCount = users.filter((user) => user.status === "active").length;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <MetricRail
        items={[
          {
            label: "Team",
            value: `${users.length}`,
            detail: "Accounts",
            icon: UsersRound,
          },
          {
            label: "Active",
            value: `${activeCount}`,
            detail: "Signed in",
            icon: UserPlus,
          },
          {
            label: "Admins",
            value: `${adminCount}`,
            detail: "Access",
            icon: ShieldCheck,
            tone: "success",
          },
        ]}
        columns={3}
      />

      <AdminSettingsSectionNav />

      <AdminTeamManager users={users} />
    </div>
  );
}
