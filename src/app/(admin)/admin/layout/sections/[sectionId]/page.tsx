import { notFound } from "next/navigation";
import { query } from "@/lib/db/client";
import { type AdminLayoutSection } from "@/lib/db/types";
import { SectionEditorForm } from "@/components/admin/layout/SectionEditorForm";

export default async function AdminSectionEditPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;

  // Generic fetch for section detail (draft only)
  const result = await query<AdminLayoutSection>(
    `
      select
        ps.id as "sectionId",
        ps.section_key as "sectionKey",
        ps.section_type as "sectionType",
        ps.sort_order as "sortOrder",
        ps.is_enabled as "isEnabled",
        ps.eyebrow,
        ps.heading,
        ps.body,
        ps.settings,
        count(distinct psp.id)::int as "presentationCount",
        count(distinct psb.id)::int as "bindingCount"
      from app.page_sections ps
      left join app.page_section_presentations psp on psp.page_section_id = ps.id
      left join app.page_section_bindings psb on psb.page_section_id = ps.id
      where ps.id = $1
      group by ps.id
    `,
    [sectionId]
  );

  const section = result.rows[0];

  if (!section) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 font-bold uppercase tracking-widest text-tertiary-label">
              <span className="text-[10px]">Version Draft</span>
              <span className="h-1 w-1 rounded-full bg-separator" />
              <span className="text-[10px]">{section.sectionType} Section</span>
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-display text-label md:text-5xl">
              {section.heading || section.sectionKey}
            </h1>
          </div>
        </div>
      </header>

      <SectionEditorForm section={section} />
    </div>
  );
}
