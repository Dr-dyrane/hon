import { isDatabaseConfigured, query, withTransaction } from "@/lib/db/client";
import type {
  AdminLayoutDraftDetail,
  AdminLayoutSection,
  AdminLayoutVersion,
  PageSectionBinding,
  PageSectionPresentation,
  PublishedPageSection,
} from "@/lib/db/types";

export async function getPageSectionsByVersion(versionId: string) {
  if (!isDatabaseConfigured()) {
    return [] satisfies PublishedPageSection[];
  }

  const result = await query<PublishedPageSection>(
    `
      select
        p.key as "pageKey",
        pv.id as "versionId",
        pv.label as "versionLabel",
        ps.id as "sectionId",
        ps.section_key as "sectionKey",
        ps.section_type as "sectionType",
        ps.sort_order as "sortOrder",
        ps.is_enabled as "isEnabled",
        ps.eyebrow,
        ps.heading,
        ps.body,
        ps.settings
      from app.page_sections ps
      inner join app.page_versions pv
        on pv.id = ps.page_version_id
      inner join app.pages p
        on p.id = pv.page_id
      where pv.id = $1
      order by ps.sort_order asc, ps.created_at asc
    `,
    [versionId]
  );

  return result.rows;
}

export async function getPublishedPageSections(pageKey: string) {
  if (!isDatabaseConfigured()) {
    return [] satisfies PublishedPageSection[];
  }

  const result = await query<PublishedPageSection>(
    `
      select
        p.key as "pageKey",
        pv.id as "versionId",
        pv.label as "versionLabel",
        ps.id as "sectionId",
        ps.section_key as "sectionKey",
        ps.section_type as "sectionType",
        ps.sort_order as "sortOrder",
        ps.is_enabled as "isEnabled",
        ps.eyebrow,
        ps.heading,
        ps.body,
        ps.settings
      from app.pages p
      inner join app.page_versions pv
        on pv.page_id = p.id
       and pv.status = 'published'
      inner join app.page_sections ps
        on ps.page_version_id = pv.id
      where p.key = $1
      order by ps.sort_order asc, ps.created_at asc
    `,
    [pageKey]
  );

  return result.rows;
}

export async function getPageSectionPresentations(pageKey: string) {
  if (!isDatabaseConfigured()) {
    return [] satisfies PageSectionPresentation[];
  }

  const result = await query<PageSectionPresentation>(
    `
      select
        psp.page_section_id as "sectionId",
        psp.breakpoint,
        psp.presentation
      from app.pages p
      inner join app.page_versions pv
        on pv.page_id = p.id
       and pv.status = 'published'
      inner join app.page_sections ps
        on ps.page_version_id = pv.id
      inner join app.page_section_presentations psp
        on psp.page_section_id = ps.id
      where p.key = $1
      order by psp.breakpoint asc
    `,
    [pageKey]
  );

  return result.rows;
}

export async function getPageSectionBindings(pageKey: string) {
  if (!isDatabaseConfigured()) {
    return [] satisfies PageSectionBinding[];
  }

  const result = await query<PageSectionBinding>(
    `
      select
        psb.page_section_id as "sectionId",
        psb.entity_type as "entityType",
        psb.entity_id as "entityId",
        psb.binding_key as "bindingKey",
        psb.sort_order as "sortOrder",
        psb.metadata
      from app.pages p
      inner join app.page_versions pv
        on pv.page_id = p.id
       and pv.status = 'published'
      inner join app.page_sections ps
        on ps.page_version_id = pv.id
      inner join app.page_section_bindings psb
        on psb.page_section_id = ps.id
      where p.key = $1
      order by psb.sort_order asc, psb.created_at asc
    `,
    [pageKey]
  );

  return result.rows;
}

/**
 * ADMIN: Layout mutations for Pass 5
 */

export async function getLayoutDraftDetail(pageKey: string): Promise<AdminLayoutDraftDetail | null> {
  if (!isDatabaseConfigured()) return null;

  const versionResult = await query<AdminLayoutVersion>(
    `
      select 
        pv.id as "versionId",
        pv.page_id as "pageId",
        pv.label,
        pv.status,
        pv.published_at as "publishedAt",
        pv.created_at as "createdAt",
        pv.updated_at as "updatedAt"
      from app.pages p
      inner join app.page_versions pv on pv.page_id = p.id
      where p.key = $1 and pv.status = 'draft'
      order by pv.updated_at desc
      limit 1
    `,
    [pageKey]
  );

  const version = versionResult.rows[0];
  if (!version) return null;

  const sectionsResult = await query<AdminLayoutSection>(
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
      where ps.page_version_id = $1
      group by ps.id
      order by ps.sort_order asc, ps.created_at asc
    `,
    [version.versionId]
  );

  return {
    version,
    sections: sectionsResult.rows,
  };
}

export async function getLayoutDraftSectionDetail(
  sectionId: string
): Promise<AdminLayoutSection | null> {
  if (!isDatabaseConfigured() || !sectionId) {
    return null;
  }

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
      inner join app.page_versions pv
        on pv.id = ps.page_version_id
       and pv.status = 'draft'
      left join app.page_section_presentations psp
        on psp.page_section_id = ps.id
      left join app.page_section_bindings psb
        on psb.page_section_id = ps.id
      where ps.id = $1
      group by ps.id
      limit 1
    `,
    [sectionId]
  );

  return result.rows[0] ?? null;
}

export async function ensureLayoutDraft(pageKey: string): Promise<string> {
  return withTransaction(async (queryFn) => {
    // 1. Find the page
    const pageRes = await queryFn('select id from app.pages where key = $1', [pageKey]);
    if (!pageRes.rows[0]) throw new Error(`Page ${pageKey} not found`);
    const pageId = pageRes.rows[0].id;

    // 2. Check if draft already exists
    const draftRes = await queryFn(
      "select id from app.page_versions where page_id = $1 and status = 'draft' limit 1",
      [pageId]
    );
    if (draftRes.rows[0]) return draftRes.rows[0].id;

    // 3. Find published version to copy from
    const pubRes = await queryFn(
      "select id, label from app.page_versions where page_id = $1 and status = 'published' limit 1",
      [pageId]
    );
    const sourceVersionId = pubRes.rows[0]?.id;
    const nextLabel = pubRes.rows[0] ? `Draft based on ${pubRes.rows[0].label}` : "Initial Draft";

    // 4. Create new draft version
    const newVersionRes = await queryFn(
      `insert into app.page_versions (page_id, label, status) 
       values ($1, $2, 'draft') 
       returning id`,
      [pageId, nextLabel]
    );
    const newVersionId = newVersionRes.rows[0].id;

    // 5. If source exists, copy sections, presentations and bindings
    if (sourceVersionId) {
      const sections = await queryFn(
        'select * from app.page_sections where page_version_id = $1',
        [sourceVersionId]
      );

      for (const section of sections.rows) {
        const newSectionRes = await queryFn(
          `insert into app.page_sections (
            page_version_id, section_key, section_type, eyebrow, heading, body, 
            settings, sort_order, is_enabled
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          returning id`,
          [
            newVersionId, section.section_key, section.section_type, 
            section.eyebrow, section.heading, section.body, 
            section.settings, section.sort_order, section.is_enabled
          ]
        );
        const newSectionId = newSectionRes.rows[0].id;

        // Copy presentations
        await queryFn(
          `insert into app.page_section_presentations (page_section_id, breakpoint, presentation)
           select $1, breakpoint, presentation
           from app.page_section_presentations
           where page_section_id = $2`,
          [newSectionId, section.id]
        );

        // Copy bindings
        await queryFn(
          `insert into app.page_section_bindings (
            page_section_id, entity_type, entity_id, binding_key, metadata, sort_order
          )
           select $1, entity_type, entity_id, binding_key, metadata, sort_order
           from app.page_section_bindings
           where page_section_id = $2`,
          [newSectionId, section.id]
        );
      }
    }

    return newVersionId;
  });
}

export async function updateLayoutSection(
  sectionId: string, 
  data: { 
    eyebrow?: string | null; 
    heading?: string | null; 
    body?: string | null;
    sortOrder?: number;
    isEnabled?: boolean;
    settings?: Record<string, unknown>;
  }
) {
  // Ensure we are only updating a DRAFT section by checking the version status
  const versionCheck = await query(
    `select pv.status 
     from app.page_sections ps
     inner join app.page_versions pv on pv.id = ps.page_version_id
     where ps.id = $1`,
    [sectionId]
  );
  
  if (versionCheck.rows[0]?.status !== 'draft') {
    throw new Error("Cannot update a non-draft section directly.");
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  if (data.eyebrow !== undefined) {
    updates.push(`eyebrow = $${index++}`);
    values.push(data.eyebrow);
  }
  if (data.heading !== undefined) {
    updates.push(`heading = $${index++}`);
    values.push(data.heading);
  }
  if (data.body !== undefined) {
    updates.push(`body = $${index++}`);
    values.push(data.body);
  }
  if (data.sortOrder !== undefined) {
    updates.push(`sort_order = $${index++}`);
    values.push(data.sortOrder);
  }
  if (data.isEnabled !== undefined) {
    updates.push(`is_enabled = $${index++}`);
    values.push(data.isEnabled);
  }
  if (data.settings !== undefined) {
    updates.push(`settings = $${index++}`);
    values.push(JSON.stringify(data.settings));
  }

  if (updates.length === 0) return;

  values.push(sectionId);
  await query(
    `update app.page_sections set ${updates.join(', ')}, updated_at = now() where id = $${index}`,
    values
  );
}

export async function publishLayoutVersion(versionId: string) {
  return withTransaction(async (queryFn) => {
    // 1. Get the page_id for this version
    const versionRes = await queryFn('select page_id from app.page_versions where id = $1', [versionId]);
    if (!versionRes.rows[0]) throw new Error("Version not found");
    const pageId = versionRes.rows[0].page_id;

    // 2. Archive any currently published versions for this page
    await queryFn(
      "update app.page_versions set status = 'archived' where page_id = $1 and status = 'published'",
      [pageId]
    );

    // 3. Promote this version to published
    await queryFn(
      "update app.page_versions set status = 'published', published_at = now(), updated_at = now() where id = $1",
      [versionId]
    );
  });
}
