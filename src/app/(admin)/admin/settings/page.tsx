import { Landmark, Route, ScanSearch } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { AdminSettingsSectionNav } from "@/components/admin/settings/AdminSettingsSectionNav";
import { requireAdminSession } from "@/lib/auth/guards";
import { AdminSettingsEditor } from "@/components/admin/settings/AdminSettingsEditor";
import { getAdminSettingsSnapshot } from "@/lib/db/repositories/settings-repository";
import { getWorkspaceNotificationPreference } from "@/lib/db/repositories/notification-preferences-repository";

export default async function AdminSettingsPage() {
  const session = await requireAdminSession("/admin/settings");
  const [snapshot, notificationPreference] = await Promise.all([
    getAdminSettingsSnapshot(),
    getWorkspaceNotificationPreference(session.email),
  ]);

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <MetricRail
        items={[
          {
            label: "Bank",
            value: snapshot.bankAccount?.bankName ?? "Pending",
            detail: "Default",
            icon: Landmark,
          },
          {
            label: "Tracking",
            value: snapshot.deliveryDefaults.trackingEnabled ? "On" : "Off",
            detail: `${snapshot.deliveryDefaults.staleTransferWindowMinutes} min`,
            icon: Route,
            tone: "success",
          },
          {
            label: "Preview",
            value: snapshot.layoutPreview.mode.replace(/_/g, " "),
            detail: "Mode",
            icon: ScanSearch,
          },
        ]}
        columns={3}
      />

      <AdminSettingsSectionNav />

      <AdminSettingsEditor
        bankAccount={snapshot.bankAccount}
        deliveryDefaults={snapshot.deliveryDefaults}
        layoutPreview={snapshot.layoutPreview}
        notificationPreference={notificationPreference}
      />
    </div>
  );
}
