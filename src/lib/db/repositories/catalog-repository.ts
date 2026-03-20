import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";
import type { PublishedCatalogProduct } from "@/lib/db/types";

export async function listPublishedCatalogProducts() {
  if (!isDatabaseConfigured()) {
    return [] satisfies PublishedCatalogProduct[];
  }

  const result = await query<PublishedCatalogProduct>(
    `
      select
        p.id as "productId",
        p.slug as "productSlug",
        p.name as "productName",
        p.marketing_name as "productMarketingName",
        p.tagline as "productTagline",
        p.short_description as "shortDescription",
        p.merchandising_state as "merchandisingState",
        p.is_available as "isAvailable",
        v.id as "variantId",
        v.slug as "variantSlug",
        v.name as "variantName",
        v.sku,
        v.price_ngn as "priceNgn",
        v.compare_at_price_ngn as "compareAtPriceNgn",
        m.storage_key as "mediaStorageKey",
        m.media_type as "mediaType"
      from app.products p
      inner join app.product_variants v
        on v.product_id = p.id
       and v.status = 'active'
      left join app.product_media m
        on m.product_id = p.id
       and m.is_primary = true
      where p.status = 'active'
      order by
        p.sort_order asc,
        v.is_default desc,
        v.sort_order asc,
        p.created_at asc
    `
  );

  return result.rows;
}
