import "server-only";

import { isDatabaseConfigured, query, withTransaction } from "@/lib/db/client";
import { slugifyProduct } from "@/lib/catalog/slug";
import type {
  AdminCatalogCategory,
  AdminCatalogProduct,
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

  const result = await query<AdminCatalogProduct>(
    `
      select
        p.id as "productId",
        p.slug as "productSlug",
        p.name as "productName",
        p.marketing_name as "productMarketingName",
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
        ii.on_hand as "inventoryOnHand",
        p.sort_order as "sortOrder",
        count(vi.ingredient_id)::int as "ingredientCount"
      from app.products p
      left join app.product_categories pc
        on pc.id = p.category_id
      inner join app.product_variants v
        on v.product_id = p.id
       and v.is_default = true
      left join app.variant_ingredients vi
        on vi.variant_id = v.id
      left join app.inventory_items ii
        on ii.variant_id = v.id
      group by
        p.id,
        p.slug,
        p.name,
        p.marketing_name,
        pc.id,
        pc.name,
        p.status,
        p.merchandising_state,
        p.is_available,
        v.id,
        v.slug,
        v.name,
        v.sku,
        v.status,
        v.price_ngn,
        v.compare_at_price_ngn,
        ii.on_hand,
        p.sort_order,
        p.created_at,
        pc.sort_order
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

  return result.rows;
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
      inner join app.product_variants v
        on v.product_id = p.id
       and v.is_default = true
      left join app.variant_ingredients vi
        on vi.variant_id = v.id
      left join app.product_media pm
        on pm.product_id = p.id
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

export async function createAdminCatalogProduct(input: {
  categoryId: string | null;
  productName: string;
  marketingName: string | null;
  variantName: string | null;
  priceNgn: string | number;
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
  });
}

export async function updateAdminCatalogInventory(
  variantId: string,
  input: {
    onHand: string | number;
    reorderThreshold?: string | number | null;
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
    [variantId, onHand, reorderThreshold]
  );
}

export async function setAdminCatalogProductAvailability(
  productId: string,
  isAvailable: boolean
) {
  requireDatabase();

  await query(
    `
      update app.products
      set is_available = $1
      where id = $2
    `,
    [isAvailable, productId]
  );
}

export async function setAdminCatalogProductMerchandising(
  productId: string,
  merchandisingState: string
) {
  requireDatabase();

  const normalizedState = normalizeMerchandisingState(merchandisingState);

  await query(
    `
      update app.products
      set merchandising_state = $1
      where id = $2
    `,
    [normalizedState, productId]
  );
}
