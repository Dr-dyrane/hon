import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";
import type {
  PageSectionBinding,
  PageSectionPresentation,
  PublishedPageSection,
} from "@/lib/db/types";

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
