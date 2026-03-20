import { notFound } from "next/navigation";
import { Eye, Layers3, Link2 } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { SectionEditorForm } from "@/components/admin/layout/SectionEditorForm";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { getLayoutDraftSectionDetail } from "@/lib/db/repositories/layout-repository";

export default async function AdminSectionEditPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;
  const section = await getLayoutDraftSectionDetail(sectionId);

  if (!section) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <WorkspaceContextPanel
        title={section.heading || section.sectionKey}
        detail="Edit copy, toggle live."
        tags={[
          { label: "Draft", tone: "muted" },
          { label: section.sectionType, tone: "muted" },
        ]}
      />

      <MetricRail
        items={[
          {
            label: "Viewports",
            value: `${section.presentationCount}`,
            detail: "Presentation slots",
            icon: Layers3,
          },
          {
            label: "Bindings",
            value: `${section.bindingCount}`,
            detail: "Connected entities",
            icon: Link2,
          },
          {
            label: "Visibility",
            value: section.isEnabled ? "On" : "Off",
            detail: section.isEnabled ? "Shown" : "Hidden",
            icon: Eye,
            tone: section.isEnabled ? "success" : "default",
          },
        ]}
        columns={3}
      />

      <SectionEditorForm section={section} />
    </div>
  );
}
