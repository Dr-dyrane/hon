import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";
import type {
  AdminCatalogProduct,
  AdminLayoutSection,
  AdminLayoutSummary,
  AdminOverviewMetrics,
} from "@/lib/db/types";

export async function getAdminOverviewMetrics() {
  if (!isDatabaseConfigured()) {
    return {
      activeProducts: 0,
      availableProducts: 0,
      featuredProducts: 0,
      enabledHomeSections: 0,
      homeBindingCount: 0,
      homeVersionLabel: null,
    } satisfies AdminOverviewMetrics;
  }

  const result = await query<AdminOverviewMetrics>(
    `
      with published_home as (
        select pv.id, pv.label
        from app.pages p
        inner join app.page_versions pv
          on pv.page_id = p.id
         and pv.status = 'published'
        where p.key = 'home'
        limit 1
      )
      select
        (
          select count(*)::int
          from app.products p
          where p.status = 'active'
        ) as "activeProducts",
        (
          select count(*)::int
          from app.products p
          where p.status = 'active'
            and p.is_available = true
        ) as "availableProducts",
        (
          select count(*)::int
          from app.products p
          where p.status = 'active'
            and p.merchandising_state = 'featured'
        ) as "featuredProducts",
        (
          select count(*)::int
          from published_home ph
          inner join app.page_sections ps
            on ps.page_version_id = ph.id
          where ps.is_enabled = true
        ) as "enabledHomeSections",
        (
          select count(*)::int
          from published_home ph
          inner join app.page_sections ps
            on ps.page_version_id = ph.id
          inner join app.page_section_bindings psb
            on psb.page_section_id = ps.id
        ) as "homeBindingCount",
        (
          select ph.label
          from published_home ph
        ) as "homeVersionLabel"
    `
  );

  return result.rows[0];
}

export async function listAdminCatalogProducts() {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminCatalogProduct[];
  }

  const result = await query<AdminCatalogProduct>(
    `
      select
        p.id as "productId",
        p.slug as "productSlug",
        p.name as "productName",
        p.marketing_name as "productMarketingName",
        pc.name as "categoryName",
        p.merchandising_state as "merchandisingState",
        p.is_available as "isAvailable",
        v.name as "variantName",
        v.price_ngn as "priceNgn",
        count(vi.ingredient_id)::int as "ingredientCount"
      from app.products p
      left join app.product_categories pc
        on pc.id = p.category_id
      inner join app.product_variants v
        on v.product_id = p.id
       and v.is_default = true
      left join app.variant_ingredients vi
        on vi.variant_id = v.id
      where p.status = 'active'
      group by
        p.id,
        p.slug,
        p.name,
        p.marketing_name,
        pc.name,
        p.merchandising_state,
        p.is_available,
        v.name,
        v.price_ngn,
        p.sort_order,
        p.created_at,
        pc.sort_order
      order by
        pc.sort_order asc nulls last,
        p.sort_order asc,
        p.created_at asc
    `
  );

  return result.rows;
}

export async function getAdminHomeLayoutSummary() {
  if (!isDatabaseConfigured()) {
    return {
      versionId: null,
      versionLabel: null,
      sectionCount: 0,
      enabledSectionCount: 0,
      bindingCount: 0,
    } satisfies AdminLayoutSummary;
  }

  const result = await query<AdminLayoutSummary>(
    `
      select
        pv.id as "versionId",
        pv.label as "versionLabel",
        count(distinct ps.id)::int as "sectionCount",
        (count(distinct ps.id) filter (where ps.is_enabled = true))::int as "enabledSectionCount",
        count(psb.id)::int as "bindingCount"
      from app.pages p
      inner join app.page_versions pv
        on pv.page_id = p.id
       and pv.status = 'published'
      left join app.page_sections ps
        on ps.page_version_id = pv.id
      left join app.page_section_bindings psb
        on psb.page_section_id = ps.id
      where p.key = 'home'
      group by pv.id, pv.label
      limit 1
    `
  );

  return (
    result.rows[0] ??
    ({
      versionId: null,
      versionLabel: null,
      sectionCount: 0,
      enabledSectionCount: 0,
      bindingCount: 0,
    } satisfies AdminLayoutSummary)
  );
}

export async function listAdminHomeLayoutSections() {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminLayoutSection[];
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
        count(distinct psp.id)::int as "presentationCount",
        count(distinct psb.id)::int as "bindingCount"
      from app.pages p
      inner join app.page_versions pv
        on pv.page_id = p.id
       and pv.status = 'published'
      inner join app.page_sections ps
        on ps.page_version_id = pv.id
      left join app.page_section_presentations psp
        on psp.page_section_id = ps.id
      left join app.page_section_bindings psb
        on psb.page_section_id = ps.id
      where p.key = 'home'
      group by
        ps.id,
        ps.section_key,
        ps.section_type,
        ps.sort_order,
        ps.is_enabled,
        ps.eyebrow,
        ps.heading,
        ps.created_at
      order by ps.sort_order asc, ps.created_at asc
    `
  );

  return result.rows;
}
