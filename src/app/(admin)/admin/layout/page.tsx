import { CheckCircle2, FileStack, Layers3 } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import {
  getLayoutDraftDetail,
  getPublishedPageSections,
} from "@/lib/db/repositories/layout-repository";
import { LayoutDashboard } from "@/components/admin/layout/LayoutDashboard";

export default async function AdminLayoutPage() {
  const publishedSections = await getPublishedPageSections("home");
  const draftDetail = await getLayoutDraftDetail("home");

  const publishedCount = publishedSections.length;
  const enabledCount = publishedSections.filter((section) => section.isEnabled).length;
  const draftVersionId = draftDetail?.version.versionId || null;
  const latestVersionLabel = publishedSections[0]?.versionLabel || "Bootstrap Home v1";
  const metrics = [
    {
      label: "Published",
      value: publishedCount.toString(),
      detail: `${enabledCount} live`,
      icon: Layers3,
    },
    {
      label: "Version",
      value: latestVersionLabel,
      detail: "Current live",
      icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: "Draft",
      value: draftVersionId ? "Edit" : "None",
      detail: draftVersionId ? "In progress" : "No draft",
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
            <p className="mt-3 text-sm leading-relaxed text-secondary-label md:text-lg">
              Draft, review, publish.
            </p>
          </div>
        </div>
      </header>

      <MetricRail items={metrics} columns={3} />

      <LayoutDashboard publishedSections={publishedSections} draftDetail={draftDetail} />
    </div>
  );
}
