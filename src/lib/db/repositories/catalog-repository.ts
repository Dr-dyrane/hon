import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";
import type { PublishedCatalogProduct } from "@/lib/db/types";
import { getStoragePublicUrl } from "@/lib/storage/s3";

function resolveCatalogMediaUrl(storageKey: string | null) {
  if (!storageKey) {
    return null;
  }

  if (/^https?:\/\//i.test(storageKey) || storageKey.startsWith("/")) {
    return storageKey;
  }

  try {
    return getStoragePublicUrl(storageKey);
  } catch {
    return null;
  }
}

export async function listPublishedCatalogProducts() {
  if (!isDatabaseConfigured()) {
    return [] satisfies PublishedCatalogProduct[];
  }

  const result = await query<
    Omit<PublishedCatalogProduct, "imageUrl" | "modelUrl">
  >(
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
        image_media.storage_key as "imageStorageKey",
        model_media.storage_key as "modelStorageKey",
        coalesce(image_media.storage_key, model_media.storage_key) as "mediaStorageKey",
        case
          when image_media.storage_key is not null then 'image'
          when model_media.storage_key is not null then 'model_3d'
          else null
        end as "mediaType"
      from app.products p
      inner join app.product_variants v
        on v.product_id = p.id
       and v.status = 'active'
       and v.is_default = true
      left join lateral (
        select pm.storage_key
        from app.product_media pm
        where (
            pm.product_id = p.id
            or pm.variant_id = v.id
          )
          and pm.media_type = 'image'
        order by
          case when pm.variant_id = v.id then 0 else 1 end asc,
          pm.is_primary desc,
          pm.sort_order asc,
          pm.created_at asc
        limit 1
      ) image_media on true
      left join lateral (
        select pm.storage_key
        from app.product_media pm
        where (
            pm.product_id = p.id
            or pm.variant_id = v.id
          )
          and pm.media_type = 'model_3d'
        order by
          case when pm.variant_id = v.id then 0 else 1 end asc,
          pm.is_primary desc,
          pm.sort_order asc,
          pm.created_at asc
        limit 1
      ) model_media on true
      where p.status = 'active'
        and p.is_available = true
        and p.merchandising_state <> 'hidden'
      order by
        p.sort_order asc,
        p.created_at asc
    `
  );

  return result.rows.map((row) => ({
    ...row,
    imageUrl: resolveCatalogMediaUrl(row.imageStorageKey),
    modelUrl: resolveCatalogMediaUrl(row.modelStorageKey),
  }));
}
