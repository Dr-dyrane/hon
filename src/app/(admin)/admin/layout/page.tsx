import { CheckCircle2, FileStack, Layers3 } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import {
  getLayoutDraftDetail,
  getPublishedPageSections,
  listLayoutVersions,
} from "@/lib/db/repositories/layout-repository";
import { LayoutDashboard } from "@/components/admin/layout/LayoutDashboard";

export default async function AdminLayoutPage() {
  const [publishedSections, draftDetail, versions] = await Promise.all([
    getPublishedPageSections("home"),
    getLayoutDraftDetail("home"),
    listLayoutVersions("home", 10),
  ]);

  const publishedCount = publishedSections.length;
  const enabledCount = publishedSections.filter((section) => section.isEnabled).length;
  const hasDraft = Boolean(draftDetail);
  const draftVersionId = draftDetail?.version.versionId || null;
  const latestVersionLabel =
    versions.find((version) => version.status === "published")?.label ||
    publishedSections[0]?.versionLabel ||
    "Bootstrap Home v1";
  const metrics = [
    {
      label: "Sections",
      value: `${enabledCount}`,
      detail: `${publishedCount} total`,
      icon: Layers3,
    },
    {
      label: "Live",
      value: "Ready",
      detail: latestVersionLabel,
      icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: "Draft",
      value: hasDraft ? "Open" : "None",
      detail: draftVersionId ? "Private edits" : "Create one",
      icon: FileStack,
    },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary-label">
              Layout
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-display text-label md:text-5xl">
              Homepage Layout
            </h1>
          </div>
        </div>
      </header>

      <MetricRail items={metrics} columns={3} />
      <div className="md:hidden rounded-[20px] bg-[color:var(--surface)]/88 px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
          Live version
        </p>
        <p className="mt-1 truncate text-sm font-medium text-label">
          {latestVersionLabel}
        </p>
      </div>

      <LayoutDashboard
        publishedSections={publishedSections}
        draftDetail={draftDetail}
        versions={versions}
      />
    </div>
  );
}
