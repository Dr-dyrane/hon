import "server-only";

import { query } from "@/lib/db/client";

type CategoryRow = {
  id: string;
  name: string;
  sortOrder: number;
};

type ProductRow = {
  id: string;
  categoryId: string;
  name: string;
  flavor: string | null;
  description: string;
  priceNgn: number;
  stats: Record<string, string>;
  ingredients: string[];
  image: string | null;
  model: string | null;
  sortOrder: number;
  isAvailable: boolean;
  merchandisingState: "featured" | "standard" | "hidden";
};

type IngredientRow = {
  id: string;
  name: string;
  detail: string;
  image: string | null;
  aliases: string[];
  sortOrder: number;
};

type SiteSettingRow = {
  key: string;
  value: unknown;
};

export async function listMarketingCategories() {
  const result = await query<CategoryRow>(
    `
      select
        slug as id,
        name,
        sort_order as "sortOrder"
      from app.product_categories
      order by sort_order asc, created_at asc
    `
  );

  return result.rows;
}

export async function listMarketingProducts() {
  const result = await query<ProductRow>(
    `
      select
        p.slug as id,
        pc.slug as "categoryId",
        p.name,
        nullif(v.attributes ->> 'flavor', '') as flavor,
        p.short_description as description,
        v.price_ngn as "priceNgn",
        coalesce(v.attributes -> 'stats', '{}'::jsonb) as stats,
        coalesce(
          jsonb_agg(vi.label order by vi.sort_order)
            filter (where vi.ingredient_id is not null),
          '[]'::jsonb
        ) as ingredients,
        image_media.storage_key as image,
        model_media.storage_key as model,
        p.sort_order as "sortOrder",
        p.is_available as "isAvailable",
        p.merchandising_state as "merchandisingState"
      from app.products p
      inner join app.product_categories pc
        on pc.id = p.category_id
      inner join app.product_variants v
        on v.product_id = p.id
       and v.status = 'active'
       and v.is_default = true
      left join app.variant_ingredients vi
        on vi.variant_id = v.id
      left join lateral (
        select storage_key
        from app.product_media
        where product_id = p.id
          and media_type = 'image'
        order by is_primary desc, sort_order asc, created_at asc
        limit 1
      ) image_media on true
      left join lateral (
        select storage_key
        from app.product_media
        where product_id = p.id
          and media_type = 'model_3d'
        order by is_primary desc, sort_order asc, created_at asc
        limit 1
      ) model_media on true
      where p.status = 'active'
        and p.is_available = true
        and p.merchandising_state <> 'hidden'
      group by
        p.slug,
        pc.slug,
        p.name,
        flavor,
        p.short_description,
        v.price_ngn,
        stats,
        image_media.storage_key,
        model_media.storage_key,
        p.sort_order,
        p.is_available,
        p.merchandising_state,
        pc.sort_order,
        p.created_at
      order by pc.sort_order asc, p.sort_order asc, p.created_at asc
    `
  );

  return result.rows;
}

export async function listMarketingIngredients() {
  const result = await query<IngredientRow>(
    `
      select
        slug as id,
        name,
        detail,
        image_path as image,
        aliases,
        sort_order as "sortOrder"
      from app.ingredients
      order by sort_order asc, created_at asc
    `
  );

  return result.rows;
}

export async function listMarketingSiteSettings(keys: string[]) {
  const result = await query<SiteSettingRow>(
    `
      select key, value
      from app.site_settings
      where key = any($1::text[])
    `,
    [keys]
  );

  return result.rows;
}
