import { Landmark, Settings2, SlidersHorizontal } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { requireAdminSession } from "@/lib/auth/guards";
import { getAdminSettingsSnapshot } from "@/lib/db/repositories/admin-repository";

function formatSettingValue(value: unknown) {
  return JSON.stringify(value, null, 2);
}

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
            detail: "Transfer",
            icon: Landmark,
          },
          {
            label: "Registry",
            value: `${snapshot.siteSettings.length}`,
            detail: "Keys",
            icon: Settings2,
            tone: "success",
          },
          {
            label: "Defaults",
            value: snapshot.siteSettings.some((setting) => setting.key === "delivery_defaults")
              ? "Live"
              : "None",
            detail: "Defaults",
            icon: SlidersHorizontal,
          },
        ]}
        columns={3}
      />

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="glass-morphism rounded-[32px] bg-system-background/72 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
            Bank
          </div>
          <div className="mt-4 space-y-3">
            <MetaItem label="Bank" value={snapshot.bankAccount?.bankName ?? "Pending"} />
            <MetaItem label="Account" value={snapshot.bankAccount?.accountName ?? "Pending"} />
            <MetaItem
              label="Number"
              value={snapshot.bankAccount?.accountNumber ?? "Pending"}
            />
            {snapshot.bankAccount?.instructions ? (
              <div className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm leading-relaxed text-secondary-label">
                {snapshot.bankAccount.instructions}
              </div>
            ) : null}
          </div>
        </article>

        <article className="glass-morphism rounded-[32px] bg-system-background/72 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
            Registry
          </div>
          <div className="mt-4 grid gap-3">
            {snapshot.siteSettings.map((setting) => (
              <div
                key={setting.key}
                className="rounded-[24px] bg-system-fill/42 px-4 py-4"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  {setting.key}
                </div>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs text-secondary-label">
                  {formatSettingValue(setting.value)}
                </pre>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-label">{value}</div>
    </div>
  );
}
