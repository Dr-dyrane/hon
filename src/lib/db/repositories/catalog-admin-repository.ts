import "server-only";

import { isDatabaseConfigured, query, withTransaction } from "@/lib/db/client";
import { slugifyProduct } from "@/lib/catalog/slug";
import { getStoragePublicUrl } from "@/lib/storage/s3";
import type {
  AdminCatalogCategory,
  AdminCatalogProduct,
  AdminCatalogProductMedia,
  AdminCatalogProductDetail,
} from "@/lib/db/types";

type SlugLookup = {
  slug: string;
};

function requireDatabase() {
  if (!isDatabaseConfigured()) {
    throw new Error("Database is not configured.");
  }
}

function normalizeOptionalText(value: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeMoney(value: string | number) {
  const numeric =
    typeof value === "number" ? value : Number.parseInt(value.trim(), 10);

  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error("Enter a valid amount.");
  }

  return Math.floor(numeric);
}

function normalizeSortOrder(value: string | number | null | undefined) {
  if (value == null || value === "") {
    return 0;
  }

  const numeric =
    typeof value === "number" ? value : Number.parseInt(value.trim(), 10);

  if (!Number.isFinite(numeric)) {
    throw new Error("Enter a valid sort order.");
  }

  return Math.floor(numeric);
}

async function buildUniqueSlug(
  queryFn: typeof query,
  table: "app.products" | "app.product_variants",
  baseValue: string,
  excludeId?: string | null
) {
  const base = slugifyProduct(baseValue) || "product";

  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? base : `${base}-${index + 1}`;
    const result = await queryFn<SlugLookup>(
      `
        select slug
        from ${table}
        where slug = $1
          and ($2::uuid is null or id <> $2::uuid)
        limit 1
      `,
      [candidate, excludeId ?? null]
    );

    if (!result.rows[0]) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique slug.");
}

async function ensureCategoryExists(categoryId: string | null) {
  if (!categoryId) {
    return;
  }

  const result = await query<{ categoryId: string }>(
    `
      select id as "categoryId"
      from app.product_categories
      where id = $1
      limit 1
    `,
    [categoryId]
  );

  if (!result.rows[0]) {
    throw new Error("Category not found.");
  }
}

function normalizeMerchandisingState(value: string) {
  if (!["standard", "featured", "hidden"].includes(value)) {
    throw new Error("Unsupported merchandising state.");
  }

  return value as "standard" | "featured" | "hidden";
}

function normalizeProductStatus(value: string) {
  if (!["draft", "active", "archived"].includes(value)) {
    throw new Error("Unsupported product status.");
  }

  return value as "draft" | "active" | "archived";
}

function resolveCatalogMediaUrl(storageKey: string) {
  if (/^https?:\/\//i.test(storageKey) || storageKey.startsWith("/")) {
    return storageKey;
  }

  try {
    return getStoragePublicUrl(storageKey);
  } catch {
    return storageKey;
  }
}

export async function listAdminCatalogCategories() {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminCatalogCategory[];
  }

  const result = await query<AdminCatalogCategory>(
    `
      select
        id as "categoryId",
        slug as "categorySlug",
        name as "categoryName"
      from app.product_categories
      order by sort_order asc, name asc
    `
  );

  return result.rows;
}

export async function listAllAdminCatalogProducts() {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminCatalogProduct[];
  }

  const result = await query<
    Omit<AdminCatalogProduct, "imageUrl" | "modelUrl">
  >(
    `
      select
        p.id as "productId",
        p.slug as "productSlug",
        p.name as "productName",
        p.marketing_name as "productMarketingName",
        p.tagline as "productTagline",
        p.short_description as "shortDescription",
        pc.id as "categoryId",
        pc.name as "categoryName",
        p.status,
        p.merchandising_state as "merchandisingState",
        p.is_available as "isAvailable",
        v.id as "variantId",
        v.slug as "variantSlug",
        v.name as "variantName",
        v.sku,
        v.status as "variantStatus",
        v.price_ngn as "priceNgn",
        v.compare_at_price_ngn as "compareAtPriceNgn",
        coalesce(ingredient_stats."ingredientCount", 0) as "ingredientCount",
        coalesce(media_stats."mediaCount", 0) as "mediaCount",
        ii.on_hand as "inventoryOnHand",
        ii.reserved as "inventoryReserved",
        ii.reorder_threshold as "reorderThreshold",
        p.sort_order as "sortOrder",
        image_media."imageStorageKey",
        model_media."modelStorageKey"
      from app.products p
      left join app.product_categories pc
        on pc.id = p.category_id
      inner join app.product_variants v
        on v.product_id = p.id
       and v.is_default = true
      left join lateral (
        select count(*)::int as "ingredientCount"
        from app.variant_ingredients vi
        where vi.variant_id = v.id
      ) ingredient_stats
        on true
      left join lateral (
        select count(*)::int as "mediaCount"
        from app.product_media pm
        where pm.product_id = p.id
           or pm.variant_id in (
             select pv.id
             from app.product_variants pv
             where pv.product_id = p.id
           )
      ) media_stats
        on true
      left join lateral (
        select pm.storage_key as "imageStorageKey"
        from app.product_media pm
        where pm.media_type = 'image'
          and (
            pm.product_id = p.id
            or pm.variant_id = v.id
          )
        order by
          case when pm.variant_id = v.id then 0 else 1 end asc,
          pm.is_primary desc,
          pm.sort_order asc,
          pm.created_at asc
        limit 1
      ) image_media
        on true
      left join lateral (
        select pm.storage_key as "modelStorageKey"
        from app.product_media pm
        where pm.media_type = 'model_3d'
          and (
            pm.product_id = p.id
            or pm.variant_id = v.id
          )
        order by
          case when pm.variant_id = v.id then 0 else 1 end asc,
          pm.is_primary desc,
          pm.sort_order asc,
          pm.created_at asc
        limit 1
      ) model_media
        on true
      left join app.inventory_items ii
        on ii.variant_id = v.id
      order by
        case p.status
          when 'active' then 0
          when 'draft' then 1
          else 2
        end asc,
        pc.sort_order asc nulls last,
        p.sort_order asc,
        p.created_at asc
    `
  );

  return result.rows.map((row) => ({
    ...row,
    imageUrl: row.imageStorageKey ? resolveCatalogMediaUrl(row.imageStorageKey) : null,
    modelUrl: row.modelStorageKey ? resolveCatalogMediaUrl(row.modelStorageKey) : null,
  }));
}

export async function getAdminCatalogProductDetail(productId: string) {
  if (!productId || !isDatabaseConfigured()) {
    return null;
  }

  const result = await query<AdminCatalogProductDetail>(
    `
      select
        p.id as "productId",
        p.slug as "productSlug",
        p.name as "productName",
        p.marketing_name as "productMarketingName",
        p.tagline as "productTagline",
        p.short_description as "shortDescription",
        p.long_description as "longDescription",
        p.category_id as "categoryId",
        pc.name as "categoryName",
        p.status,
        p.merchandising_state as "merchandisingState",
        p.is_available as "isAvailable",
        p.sort_order as "sortOrder",
        v.id as "variantId",
        v.slug as "variantSlug",
        v.name as "variantName",
        v.sku,
        v.size_label as "sizeLabel",
        v.unit_label as "unitLabel",
        v.price_ngn as "priceNgn",
        v.compare_at_price_ngn as "compareAtPriceNgn",
        v.status as "variantStatus",
        count(distinct vi.ingredient_id)::int as "ingredientCount",
        count(distinct pm.id)::int as "mediaCount",
        ii.on_hand as "inventoryOnHand",
        ii.reserved as "inventoryReserved",
        ii.reorder_threshold as "reorderThreshold"
      from app.products p
      left join app.product_categories pc
        on pc.id = p.category_id
      inner join app.product_variants v
        on v.product_id = p.id
       and v.is_default = true
      left join app.variant_ingredients vi
        on vi.variant_id = v.id
      left join app.product_media pm
        on pm.product_id = p.id
        or pm.variant_id = v.id
      left join app.inventory_items ii
        on ii.variant_id = v.id
      where p.id = $1
      group by
        p.id,
        p.slug,
        p.name,
        p.marketing_name,
        p.tagline,
        p.short_description,
        p.long_description,
        p.category_id,
        pc.name,
        p.status,
        p.merchandising_state,
        p.is_available,
        p.sort_order,
        v.id,
        v.slug,
        v.name,
        v.sku,
        v.size_label,
        v.unit_label,
        v.price_ngn,
        v.compare_at_price_ngn,
        v.status,
        ii.on_hand,
        ii.reserved,
        ii.reorder_threshold
      limit 1
    `,
    [productId]
  );

  return result.rows[0] ?? null;
}

export async function listAdminCatalogProductMedia(productId: string) {
  if (!productId || !isDatabaseConfigured()) {
    return [] satisfies AdminCatalogProductMedia[];
  }

  const result = await query<
    Omit<AdminCatalogProductMedia, "publicUrl"> & { createdAt: string }
  >(
    `
      select
        pm.id as "mediaId",
        pm.product_id as "productId",
        pm.variant_id as "variantId",
        case
          when pm.variant_id is not null then 'variant'
          else 'product'
        end as "targetType",
        case
          when pm.variant_id is not null then coalesce(v.name, 'Variant')
          else coalesce(p.marketing_name, p.name, 'Product')
        end as "targetLabel",
        pm.media_type as "mediaType",
        pm.storage_key as "storageKey",
        pm.alt_text as "altText",
        pm.sort_order as "sortOrder",
        pm.is_primary as "isPrimary",
        pm.metadata,
        pm.created_at as "createdAt"
      from app.product_media pm
      left join app.products p
        on p.id = pm.product_id
      left join app.product_variants v
        on v.id = pm.variant_id
      where pm.product_id = $1
         or pm.variant_id in (
           select pv.id
           from app.product_variants pv
           where pv.product_id = $1
         )
      order by
        "targetType" asc,
        pm.media_type asc,
        pm.is_primary desc,
        pm.sort_order asc,
        pm.created_at asc
    `,
    [productId]
  );

  return result.rows.map((row) => ({
    ...row,
    publicUrl: resolveCatalogMediaUrl(row.storageKey),
  }));
}

export async function createAdminCatalogProduct(input: {
  categoryId: string | null;
  productName: string;
  marketingName: string | null;
  variantName: string | null;
  priceNgn: string | number;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  requireDatabase();

  const productName = input.productName.trim();
  const marketingName = normalizeOptionalText(input.marketingName);
  const variantName =
    normalizeOptionalText(input.variantName) ?? `${productName} Default`;
  const priceNgn = normalizeMoney(input.priceNgn);
  const categoryId = input.categoryId || null;

  if (productName.length < 2) {
    throw new Error("Enter a product name.");
  }

  await ensureCategoryExists(categoryId);

  return withTransaction(async (queryFn) => {
    const productSlug = await buildUniqueSlug(
      queryFn,
      "app.products",
      marketingName ?? productName
    );
    const variantSlug = await buildUniqueSlug(
      queryFn,
      "app.product_variants",
      `${productSlug}-default`
    );
    const skuBase = slugifyProduct(productName).replace(/-/g, "").toUpperCase() || "PRAX";
    const sku = `${skuBase.slice(0, 8)}-${Date.now().toString().slice(-6)}`;
    const productResult = await queryFn<{ productId: string }>(
      `
        insert into app.products (
          category_id,
          slug,
          name,
          marketing_name,
          short_description,
          status,
          merchandising_state,
          is_available,
          sort_order
        )
        values ($1, $2, $3, $4, $5, 'draft', 'standard', false, 0)
        returning id as "productId"
      `,
      [categoryId, productSlug, productName, marketingName, productName]
    );
    const productId = productResult.rows[0]?.productId;

    if (!productId) {
      throw new Error("Unable to create product.");
    }

    const variantResult = await queryFn<{ variantId: string }>(
      `
        insert into app.product_variants (
          product_id,
          sku,
          slug,
          name,
          price_ngn,
          status,
          is_default,
          sort_order
        )
        values ($1, $2, $3, $4, $5, 'draft', true, 0)
        returning id as "variantId"
      `,
      [productId, sku, variantSlug, variantName, priceNgn]
    );
    const variantId = variantResult.rows[0]?.variantId;

    if (variantId) {
      await queryFn(
        `
          insert into app.inventory_items (
            variant_id,
            on_hand,
            reserved,
            reorder_threshold
          )
          values ($1, 0, 0, null)
          on conflict (variant_id)
          do nothing
        `,
        [variantId]
      );
    }

    return productId;
  }, {
    actor: {
      userId: input.actorUserId ?? null,
      email: input.actorEmail ?? null,
      role: "admin",
    },
  });
}

export async function updateAdminCatalogProduct(input: {
  productId: string;
  categoryId: string | null;
  productName: string;
  marketingName: string | null;
  tagline: string | null;
  shortDescription: string;
  longDescription: string | null;
  status: string;
  merchandisingState: string;
  isAvailable: boolean;
  sortOrder: string | number;
  variantName: string;
  sizeLabel: string | null;
  unitLabel: string | null;
  priceNgn: string | number;
  compareAtPriceNgn: string | number | null;
  variantStatus?: string;
  inventoryOnHand?: string | number;
  reorderThreshold?: string | number | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  requireDatabase();

  const productId = input.productId;
  const productName = input.productName.trim();
  const marketingName = normalizeOptionalText(input.marketingName);
  const tagline = normalizeOptionalText(input.tagline);
  const shortDescription = input.shortDescription.trim();
  const longDescription = normalizeOptionalText(input.longDescription);
  const categoryId = input.categoryId || null;
  const status = normalizeProductStatus(input.status);
  const merchandisingState = normalizeMerchandisingState(input.merchandisingState);
  const isAvailable = Boolean(input.isAvailable);
  const sortOrder = normalizeSortOrder(input.sortOrder);
  const variantName = input.variantName.trim();
  const sizeLabel = normalizeOptionalText(input.sizeLabel);
  const unitLabel = normalizeOptionalText(input.unitLabel);
  const priceNgn = normalizeMoney(input.priceNgn);
  const compareAtPriceNgn =
    input.compareAtPriceNgn == null || input.compareAtPriceNgn === ""
      ? null
      : normalizeMoney(input.compareAtPriceNgn);
  const variantStatus = input.variantStatus ? normalizeProductStatus(input.variantStatus) : (status === "archived" ? "archived" : "active");
  const onHand = input.inventoryOnHand != null ? normalizeMoney(input.inventoryOnHand) : null;
  const threshold = input.reorderThreshold == null || input.reorderThreshold === ""
    ? null
    : normalizeMoney(input.reorderThreshold);

  if (!productId) {
    throw new Error("Product is required.");
  }

  if (productName.length < 2) {
    throw new Error("Enter a product name.");
  }

  if (shortDescription.length < 2) {
    throw new Error("Enter a short description.");
  }

  if (variantName.length < 2) {
    throw new Error("Enter a variant name.");
  }

  if (compareAtPriceNgn !== null && compareAtPriceNgn < priceNgn) {
    throw new Error("Compare-at price must be at least the price.");
  }

  await ensureCategoryExists(categoryId);

  return withTransaction(async (queryFn) => {
    const detail = await getAdminCatalogProductDetail(productId);

    if (!detail) {
      throw new Error("Product not found.");
    }

    const productSlug = await buildUniqueSlug(
      queryFn,
      "app.products",
      marketingName ?? productName,
      productId
    );
    const variantSlug = await buildUniqueSlug(
      queryFn,
      "app.product_variants",
      `${productSlug}-default`,
      detail.variantId
    );

    await queryFn(
      `
        update app.products
        set
          category_id = $1,
          slug = $2,
          name = $3,
          marketing_name = $4,
          tagline = $5,
          short_description = $6,
          long_description = $7,
          status = $8,
          merchandising_state = $9,
          is_available = $10,
          sort_order = $11
        where id = $12
      `,
      [
        categoryId,
        productSlug,
        productName,
        marketingName,
        tagline,
        shortDescription,
        longDescription,
        status,
        merchandisingState,
        isAvailable,
        sortOrder,
        productId,
      ]
    );

    await queryFn(
      `
        update app.product_variants
        set
          slug = $1,
          name = $2,
          size_label = $3,
          unit_label = $4,
          price_ngn = $5,
          compare_at_price_ngn = $6,
          status = $7
        where id = $8
      `,
      [
        variantSlug,
        variantName,
        sizeLabel,
        unitLabel,
        priceNgn,
        compareAtPriceNgn,
        variantStatus,
        detail.variantId,
      ]
    );

    await queryFn(
      `
        insert into app.inventory_items (
          variant_id,
          on_hand,
          reserved,
          reorder_threshold
        )
        values ($1, coalesce($2, 0), 0, $3)
        on conflict (variant_id)
        do update set
          on_hand = coalesce($2, app.inventory_items.on_hand),
          reorder_threshold = case when $4 then $3 else app.inventory_items.reorder_threshold end,
          updated_at = timezone('utc', now())
      `,
      [
        detail.variantId,
        onHand,
        threshold,
        input.reorderThreshold !== undefined
      ]
    );
  }, {
    actor: {
      userId: input.actorUserId ?? null,
      email: input.actorEmail ?? null,
      role: "admin",
    },
  });
}

export async function updateAdminCatalogInventory(
  variantId: string,
  input: {
    onHand: string | number;
    reorderThreshold?: string | number | null;
    actorUserId?: string | null;
    actorEmail?: string | null;
  }
) {
  requireDatabase();

  const onHand = normalizeMoney(input.onHand);
  const reorderThreshold =
    input.reorderThreshold == null || input.reorderThreshold === ""
      ? null
      : normalizeMoney(input.reorderThreshold);

  await query(
    `
      insert into app.inventory_items (
        variant_id,
        on_hand,
        reserved,
        reorder_threshold
      )
      values ($1, $2, 0, $3)
      on conflict (variant_id)
      do update set
        on_hand = $2,
        reorder_threshold = $3,
        updated_at = timezone('utc', now())
    `,
    [variantId, onHand, reorderThreshold],
    {
      actor: {
        userId: input.actorUserId ?? null,
        email: input.actorEmail ?? null,
        role: "admin",
      },
    }
  );
}

export async function setAdminCatalogProductAvailability(
  productId: string,
  isAvailable: boolean,
  actor?: {
    userId?: string | null;
    email?: string | null;
  }
) {
  requireDatabase();

  await query(
    `
      update app.products
      set is_available = $1
      where id = $2
    `,
    [isAvailable, productId],
    {
      actor: {
        userId: actor?.userId ?? null,
        email: actor?.email ?? null,
        role: "admin",
      },
    }
  );
}

export async function setAdminCatalogProductMerchandising(
  productId: string,
  merchandisingState: string,
  actor?: {
    userId?: string | null;
    email?: string | null;
  }
) {
  requireDatabase();

  const normalizedState = normalizeMerchandisingState(merchandisingState);

  await query(
    `
      update app.products
      set merchandising_state = $1
      where id = $2
    `,
    [normalizedState, productId],
    {
      actor: {
        userId: actor?.userId ?? null,
        email: actor?.email ?? null,
        role: "admin",
      },
    }
  );
}

export async function archiveAdminCatalogProduct(
  productId: string,
  actor?: {
    userId?: string | null;
    email?: string | null;
  }
) {
  requireDatabase();

  if (!productId) {
    throw new Error("Product is required.");
  }

  await withTransaction(async (queryFn) => {
    const result = await queryFn<{ productId: string }>(
      `
        select id as "productId"
        from app.products
        where id = $1
        limit 1
      `,
      [productId]
    );

    if (!result.rows[0]) {
      throw new Error("Product not found.");
    }

    await queryFn(
      `
        update app.products
        set
          status = 'archived',
          is_available = false,
          merchandising_state = 'hidden'
        where id = $1
      `,
      [productId]
    );

    await queryFn(
      `
        update app.product_variants
        set status = 'archived'
        where product_id = $1
      `,
      [productId]
    );
  }, {
    actor: {
      userId: actor?.userId ?? null,
      email: actor?.email ?? null,
      role: "admin",
    },
  });
}

export async function deleteAdminCatalogProduct(
  productId: string,
  actor?: {
    userId?: string | null;
    email?: string | null;
  }
) {
  requireDatabase();

  if (!productId) {
    throw new Error("Product is required.");
  }

  return withTransaction(async (queryFn) => {
    const productResult = await queryFn<{
      productId: string;
      productSlug: string;
      status: string;
    }>(
      `
        select
          id as "productId",
          slug as "productSlug",
          status
        from app.products
        where id = $1
        limit 1
      `,
      [productId]
    );

    const product = productResult.rows[0];

    if (!product) {
      throw new Error("Product not found.");
    }

    if (product.status !== "archived") {
      throw new Error("Archive the product first.");
    }

    const openOrderResult = await queryFn<{ hasOpenOrders: boolean }>(
      `
        select exists (
          select 1
          from app.order_items oi
          inner join app.orders o
            on o.id = oi.order_id
          where o.status not in ('delivered', 'cancelled', 'expired')
            and (
              oi.variant_id in (
                select id
                from app.product_variants
                where product_id = $1
              )
              or oi.snapshot ->> 'productId' = $2
            )
        ) as "hasOpenOrders"
      `,
      [productId, product.productSlug]
    );

    if (openOrderResult.rows[0]?.hasOpenOrders) {
      throw new Error("This product is still attached to an open order.");
    }

    const mediaResult = await queryFn<{ storageKey: string }>(
      `
        select storage_key as "storageKey"
        from app.product_media
        where product_id = $1
           or variant_id in (
             select id
             from app.product_variants
             where product_id = $1
           )
      `,
      [productId]
    );

    await queryFn(
      `
        delete from app.products
        where id = $1
      `,
      [productId]
    );

    return mediaResult.rows.map((row) => row.storageKey);
  }, {
    actor: {
      userId: actor?.userId ?? null,
      email: actor?.email ?? null,
      role: "admin",
    },
  });
}

export async function createAdminCatalogProductMedia(input: {
  productId: string;
  variantId?: string | null;
  mediaType: "image" | "model_3d" | "video";
  storageKey: string;
  altText?: string | null;
  metadata?: Record<string, unknown>;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  requireDatabase();

  const productId = input.productId;
  const variantId = input.variantId ?? null;
  const mediaType = input.mediaType;
  const storageKey = input.storageKey.trim();
  const altText = normalizeOptionalText(input.altText ?? null);
  const metadata = input.metadata ?? {};

  if (!productId || !storageKey) {
    throw new Error("Product media is incomplete.");
  }

  return withTransaction(async (queryFn) => {
    const productResult = await queryFn<{ productId: string; variantId: string }>(
      `
        select
          p.id as "productId",
          v.id as "variantId"
        from app.products
        left join app.product_variants v
          on v.product_id = p.id
         and v.is_default = true
        where p.id = $1
        limit 1
      `,
      [productId]
    );

    const product = productResult.rows[0];

    if (!product) {
      throw new Error("Product not found.");
    }

    if (variantId && variantId !== product.variantId) {
      throw new Error("Variant does not belong to this product.");
    }

    const targetProductId = variantId ? null : productId;
    const targetVariantId = variantId ? variantId : null;

    const primaryResult = await queryFn<{ mediaId: string }>(
      `
        select id as "mediaId"
        from app.product_media
        where (
            (product_id = $1 and $3::uuid is null)
            or (variant_id = $3 and $3::uuid is not null)
          )
          and media_type = $2
          and is_primary = true
        limit 1
      `,
      [targetProductId, mediaType, targetVariantId]
    );

    const sortOrderResult = await queryFn<{ nextSortOrder: number }>(
      `
        select coalesce(max(sort_order), -1) + 1 as "nextSortOrder"
        from app.product_media
        where (
            (product_id = $1 and $3::uuid is null)
            or (variant_id = $3 and $3::uuid is not null)
          )
          and media_type = $2
      `,
      [targetProductId, mediaType, targetVariantId]
    );

    const shouldBePrimary = !primaryResult.rows[0];
    const nextSortOrder = sortOrderResult.rows[0]?.nextSortOrder ?? 0;

    const insertResult = await queryFn<{ mediaId: string }>(
      `
        insert into app.product_media (
          product_id,
          variant_id,
          media_type,
          storage_key,
          alt_text,
          sort_order,
          is_primary,
          metadata
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        returning id as "mediaId"
      `,
      [
        targetProductId,
        targetVariantId,
        mediaType,
        storageKey,
        altText,
        nextSortOrder,
        shouldBePrimary,
        JSON.stringify(metadata),
      ]
    );

    return insertResult.rows[0]?.mediaId ?? null;
  }, {
    actor: {
      userId: input.actorUserId ?? null,
      email: input.actorEmail ?? null,
      role: "admin",
    },
  });
}

export async function updateAdminCatalogProductMedia(input: {
  mediaId: string;
  productId: string;
  altText?: string | null;
  sortOrder?: string | number | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  requireDatabase();

  const mediaId = input.mediaId;
  const productId = input.productId;
  const altText = normalizeOptionalText(input.altText ?? null);
  const sortOrder =
    input.sortOrder == null || input.sortOrder === ""
      ? null
      : normalizeSortOrder(input.sortOrder);

  if (!mediaId || !productId) {
    throw new Error("Media reference is incomplete.");
  }

  await query(
    `
      update app.product_media
      set
        alt_text = $1,
        sort_order = coalesce($2, sort_order)
      where id = $3
        and (
          product_id = $4
          or variant_id in (
            select id
            from app.product_variants
            where product_id = $4
          )
        )
    `,
    [altText, sortOrder, mediaId, productId],
    {
      actor: {
        userId: input.actorUserId ?? null,
        email: input.actorEmail ?? null,
        role: "admin",
      },
    }
  );
}

export async function setAdminCatalogProductMediaPrimary(input: {
  mediaId: string;
  productId: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  requireDatabase();

  const mediaId = input.mediaId;
  const productId = input.productId;

  if (!mediaId || !productId) {
    throw new Error("Media reference is incomplete.");
  }

  await withTransaction(async (queryFn) => {
    const mediaResult = await queryFn<{
      mediaId: string;
      productId: string | null;
      variantId: string | null;
      mediaType: "image" | "model_3d" | "video";
    }>(
      `
        select
          id as "mediaId",
          product_id as "productId",
          variant_id as "variantId",
          media_type as "mediaType"
        from app.product_media
        where id = $1
          and (
            product_id = $2
            or variant_id in (
              select id
              from app.product_variants
              where product_id = $2
            )
          )
        limit 1
      `,
      [mediaId, productId]
    );

    const media = mediaResult.rows[0];

    if (!media) {
      throw new Error("Media not found.");
    }

    await queryFn(
      `
        update app.product_media
        set is_primary = false
        where (
            (product_id = $1 and $3::uuid is null)
            or (variant_id = $3 and $3::uuid is not null)
          )
          and media_type = $2
      `,
      [media.productId, media.mediaType, media.variantId]
    );

    await queryFn(
      `
        update app.product_media
        set is_primary = true
        where id = $1
      `,
      [mediaId]
    );
  }, {
    actor: {
      userId: input.actorUserId ?? null,
      email: input.actorEmail ?? null,
      role: "admin",
    },
  });
}

export async function deleteAdminCatalogProductMedia(input: {
  mediaId: string;
  productId: string;
  actorUserId?: string | null;
  actorEmail?: string | null;
}) {
  requireDatabase();

  const mediaId = input.mediaId;
  const productId = input.productId;

  if (!mediaId || !productId) {
    throw new Error("Media reference is incomplete.");
  }

  return withTransaction(async (queryFn) => {
    const mediaResult = await queryFn<{
      mediaId: string;
      mediaType: "image" | "model_3d" | "video";
      storageKey: string;
      isPrimary: boolean;
      productId: string | null;
      variantId: string | null;
    }>(
      `
        select
          id as "mediaId",
          media_type as "mediaType",
          storage_key as "storageKey",
          is_primary as "isPrimary",
          product_id as "productId",
          variant_id as "variantId"
        from app.product_media
        where id = $1
          and (
            product_id = $2
            or variant_id in (
              select id
              from app.product_variants
              where product_id = $2
            )
          )
        limit 1
      `,
      [mediaId, productId]
    );

    const media = mediaResult.rows[0];

    if (!media) {
      throw new Error("Media not found.");
    }

    await queryFn(
      `
        delete from app.product_media
        where id = $1
      `,
      [mediaId]
    );

    if (media.isPrimary) {
      await queryFn(
        `
          with next_media as (
            select id
            from app.product_media
            where (
                (product_id = $1 and $3::uuid is null)
                or (variant_id = $3 and $3::uuid is not null)
              )
              and media_type = $2
            order by sort_order asc, created_at asc
            limit 1
          )
          update app.product_media
          set is_primary = true
          where id = (select id from next_media)
        `,
        [media.productId, media.mediaType, media.variantId]
      );
    }

    return media.storageKey;
  }, {
    actor: {
      userId: input.actorUserId ?? null,
      email: input.actorEmail ?? null,
      role: "admin",
    },
  });
}
