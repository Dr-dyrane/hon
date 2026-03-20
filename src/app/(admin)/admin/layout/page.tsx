import { ScaffoldPage } from "@/components/shell/ScaffoldPage";
import {
  getAdminHomeLayoutSummary,
  listAdminHomeLayoutSections,
} from "@/lib/db/repositories/admin-repository";

export default async function AdminLayoutPage() {
  const [summary, sections] = await Promise.all([
    getAdminHomeLayoutSummary(),
    listAdminHomeLayoutSections(),
  ]);

  return (
    <ScaffoldPage
      badge="Layout"
      title="Published layout state is now visible."
      description="The homepage composition is no longer trapped in static code. This route reads the current published version, section order, and binding coverage from Aurora."
      primaryAction={{ href: "/admin/catalog/products", label: "Open Catalog" }}
      summary={[
        {
          label: "Version",
          value: summary.versionLabel ?? "None",
          detail: "Only one published version remains live at a time, exactly as planned.",
        },
        {
          label: "Sections",
          value: summary.enabledSectionCount.toString(),
          detail: `${summary.sectionCount} total sections exist in the current home composition.`,
        },
        {
          label: "Bindings",
          value: summary.bindingCount.toString(),
          detail: "Bindings stay explicit so merchandising remains inspectable and auditable.",
        },
      ]}
      sections={[
        {
          title: "Published Sequence",
          description: "Section order is now the live order, not an assumption.",
          items: sections.map((section) => {
            const title =
              section.heading ?? section.eyebrow ?? section.sectionKey.replaceAll("_", " ");
            return `${section.sortOrder + 1}. ${title}, ${section.sectionType}, ${section.isEnabled ? "enabled" : "disabled"}`;
          }),
        },
        {
          title: "Breakpoint Coverage",
          description: "Published sections can now be audited against the planned mobile, tablet, and desktop model.",
          items: sections.map(
            (section) =>
              `${section.sectionKey} has ${section.presentationCount} presentation records and ${section.bindingCount} bindings`
          ),
        },
        {
          title: "Constraint Reminder",
          description: "This stays a structured merchandising surface, not a generic builder.",
          items: [
            "Publishing remains versioned and single-live.",
            "Section settings stay bounded instead of freeform.",
            "Bindings stay attached to approved entities only.",
          ],
        },
      ]}
    />
  );
}
