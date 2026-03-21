import { Landmark, Route, ScanSearch } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAdminSession } from "@/lib/auth/guards";
import { AdminSettingsEditor } from "@/components/admin/settings/AdminSettingsEditor";
import { getAdminSettingsSnapshot } from "@/lib/db/repositories/settings-repository";

export default async function AdminSettingsPage() {
  await requireAdminSession("/admin/settings");
  const snapshot = await getAdminSettingsSnapshot();

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

      <AdminSettingsEditor
        bankAccount={snapshot.bankAccount}
        deliveryDefaults={snapshot.deliveryDefaults}
        layoutPreview={snapshot.layoutPreview}
      />
    </div>
  );
}
