import { marketingBootstrap } from "../../src/lib/marketing/bootstrap-data.mjs";

async function upsertCategory(client, category) {
  const result = await client.query(
    `
      insert into app.product_categories (slug, name, sort_order)
      values ($1, $2, $3)
      on conflict (slug)
      do update set
        name = excluded.name,
        sort_order = excluded.sort_order,
        updated_at = timezone('utc', now())
      returning id
    `,
    [category.id, category.name, category.sortOrder]
  );

  return result.rows[0].id;
}

async function upsertProduct(client, product, categoryId) {
  const productResult = await client.query(
    `
      insert into app.products (
        category_id,
        slug,
        name,
        tagline,
        short_description,
        status,
        merchandising_state,
        is_available,
        sort_order
      )
      values ($1, $2, $3, $4, $5, 'active', $6, $7, $8)
      on conflict (slug)
      do update set
        category_id = excluded.category_id,
        name = excluded.name,
        tagline = excluded.tagline,
        short_description = excluded.short_description,
        status = excluded.status,
        merchandising_state = excluded.merchandising_state,
        is_available = excluded.is_available,
        sort_order = excluded.sort_order,
        updated_at = timezone('utc', now())
      returning id
    `,
    [
      categoryId,
      product.id,
      product.name,
      product.flavor ?? null,
      product.description,
      product.merchandisingState,
      product.isAvailable,
      product.sortOrder,
    ]
  );
  const productId = productResult.rows[0].id;

  const variantResult = await client.query(
    `
      insert into app.product_variants (
        product_id,
        sku,
        slug,
        name,
        price_ngn,
        status,
        is_default,
        sort_order,
        attributes
      )
      values ($1, $2, $3, $4, $5, 'active', true, 0, $6::jsonb)
      on conflict (slug)
      do update set
        product_id = excluded.product_id,
        sku = excluded.sku,
        name = excluded.name,
        price_ngn = excluded.price_ngn,
        status = excluded.status,
        is_default = excluded.is_default,
        sort_order = excluded.sort_order,
        attributes = excluded.attributes,
        updated_at = timezone('utc', now())
      returning id
    `,
    [
      productId,
      `HOP-${product.id.toUpperCase()}`,
      product.id,
      product.flavor ?? product.name,
      product.priceNgn,
      JSON.stringify({
        flavor: product.flavor ?? null,
        stats: product.stats,
      }),
    ]
  );

  return {
    productId,
    variantId: variantResult.rows[0].id,
  };
}

async function upsertProductMedia(client, productId, mediaType, storageKey, isPrimary) {
  const existing = await client.query(
    `
      select id
      from app.product_media
      where product_id = $1
        and media_type = $2
        and storage_key = $3
      limit 1
    `,
    [productId, mediaType, storageKey]
  );

  if (existing.rowCount && existing.rows[0]) {
    await client.query(
      `
        update app.product_media
        set
          is_primary = $4,
          updated_at = timezone('utc', now())
        where id = $1
      `,
      [existing.rows[0].id, productId, mediaType, isPrimary]
    );
    return;
  }

  await client.query(
    `
      insert into app.product_media (
        product_id,
        media_type,
        storage_key,
        sort_order,
        is_primary
      )
      values ($1, $2, $3, 0, $4)
    `,
    [productId, mediaType, storageKey, isPrimary]
  );
}

async function upsertIngredient(client, ingredient) {
  const result = await client.query(
    `
      insert into app.ingredients (
        slug,
        name,
        detail,
        sort_order,
        image_path,
        aliases
      )
      values ($1, $2, $3, $4, $5, $6::jsonb)
      on conflict (slug)
      do update set
        name = excluded.name,
        detail = excluded.detail,
        sort_order = excluded.sort_order,
        image_path = excluded.image_path,
        aliases = excluded.aliases,
        updated_at = timezone('utc', now())
      returning id
    `,
    [
      ingredient.id,
      ingredient.name,
      ingredient.detail,
      ingredient.sortOrder,
      ingredient.image,
      JSON.stringify(ingredient.aliases),
    ]
  );

  return result.rows[0].id;
}

async function upsertSiteSetting(client, key, value) {
  await client.query(
    `
      insert into app.site_settings (key, value)
      values ($1, $2::jsonb)
      on conflict (key)
      do update set
        value = excluded.value,
        updated_at = timezone('utc', now())
    `,
    [key, JSON.stringify(value)]
  );
}

async function ensurePageVersion(client, pageKey, label) {
  const pageResult = await client.query(
    "select id from app.pages where key = $1 limit 1",
    [pageKey]
  );
  const pageId = pageResult.rows[0]?.id;

  if (!pageId) {
    throw new Error(`Page ${pageKey} must exist before marketing content seed runs.`);
  }

  await client.query(
    `
      update app.page_versions
      set
        status = 'archived',
        updated_at = timezone('utc', now())
      where page_id = $1
        and status = 'published'
        and label <> $2
    `,
    [pageId, label]
  );

  const existing = await client.query(
    `
      select id
      from app.page_versions
      where page_id = $1
        and label = $2
      limit 1
    `,
    [pageId, label]
  );

  if (existing.rowCount && existing.rows[0]) {
    await client.query(
      `
        update app.page_versions
        set
          status = 'published',
          published_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        where id = $1
      `,
      [existing.rows[0].id]
    );

    return existing.rows[0].id;
  }

  const inserted = await client.query(
    `
      insert into app.page_versions (
        page_id,
        label,
        status,
        published_at
      )
      values ($1, $2, 'published', timezone('utc', now()))
      returning id
    `,
    [pageId, label]
  );

  return inserted.rows[0].id;
}

async function upsertPageSection(client, pageVersionId, section) {
  const result = await client.query(
    `
      insert into app.page_sections (
        page_version_id,
        section_key,
        section_type,
        eyebrow,
        heading,
        body,
        settings,
        sort_order,
        is_enabled
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
      on conflict (page_version_id, section_key)
      do update set
        section_type = excluded.section_type,
        eyebrow = excluded.eyebrow,
        heading = excluded.heading,
        body = excluded.body,
        settings = excluded.settings,
        sort_order = excluded.sort_order,
        is_enabled = excluded.is_enabled,
        updated_at = timezone('utc', now())
      returning id
    `,
    [
      pageVersionId,
      section.sectionKey,
      section.sectionType,
      section.eyebrow,
      section.heading,
      section.body,
      JSON.stringify(section.settings),
      section.sortOrder,
      section.isEnabled,
    ]
  );

  return result.rows[0].id;
}

async function upsertPageSectionPresentation(client, sectionId, breakpoint, presentation) {
  await client.query(
    `
      insert into app.page_section_presentations (
        page_section_id,
        breakpoint,
        presentation
      )
      values ($1, $2, $3::jsonb)
      on conflict (page_section_id, breakpoint)
      do update set
        presentation = excluded.presentation,
        updated_at = timezone('utc', now())
    `,
    [sectionId, breakpoint, JSON.stringify(presentation)]
  );
}

async function resetPageSectionBindings(client, sectionId, bindings) {
  await client.query(
    "delete from app.page_section_bindings where page_section_id = $1",
    [sectionId]
  );

  for (const binding of bindings) {
    await client.query(
      `
        insert into app.page_section_bindings (
          page_section_id,
          entity_type,
          entity_id,
          binding_key,
          metadata,
          sort_order
        )
        values ($1, $2, $3, $4, $5::jsonb, $6)
      `,
      [
        sectionId,
        binding.entityType,
        binding.entityId,
        binding.bindingKey,
        JSON.stringify(binding.metadata ?? {}),
        binding.sortOrder,
      ]
    );
  }
}

export async function run(client) {
  const categoryIds = new Map();
  const productIds = new Map();
  const variantIds = new Map();
  const ingredientIds = new Map();

  for (const category of marketingBootstrap.categories) {
    categoryIds.set(category.id, await upsertCategory(client, category));
  }

  for (const product of marketingBootstrap.products) {
    const ids = await upsertProduct(client, product, categoryIds.get(product.categoryId));
    productIds.set(product.id, ids.productId);
    variantIds.set(product.id, ids.variantId);

    await upsertProductMedia(client, ids.productId, "image", product.image, true);
    await upsertProductMedia(client, ids.productId, "model_3d", product.model, false);
  }

  for (const ingredient of marketingBootstrap.ingredients) {
    ingredientIds.set(ingredient.id, await upsertIngredient(client, ingredient));
  }

  for (const product of marketingBootstrap.products) {
    const variantId = variantIds.get(product.id);

    await client.query(
      "delete from app.variant_ingredients where variant_id = $1",
      [variantId]
    );

    for (const [index, ingredientName] of product.ingredients.entries()) {
      const normalizedName = ingredientName.toLowerCase();
      const ingredient = marketingBootstrap.ingredients.find((entry) =>
        entry.aliases.some((alias) => alias.toLowerCase() === normalizedName)
      );

      if (!ingredient) {
        continue;
      }

      await client.query(
        `
          insert into app.variant_ingredients (
            variant_id,
            ingredient_id,
            label,
            sort_order
          )
          values ($1, $2, $3, $4)
          on conflict (variant_id, ingredient_id)
          do update set
            label = excluded.label,
            sort_order = excluded.sort_order
        `,
        [variantId, ingredientIds.get(ingredient.id), ingredientName, index]
      );
    }
  }

  await upsertSiteSetting(client, "marketing_brand", marketingBootstrap.brand);
  await upsertSiteSetting(client, "marketing_navigation", marketingBootstrap.navigation);
  await upsertSiteSetting(client, "marketing_benefits", marketingBootstrap.benefits);
  await upsertSiteSetting(client, "marketing_social_proof", marketingBootstrap.socialProof);

  const homeVersionId = await ensurePageVersion(
    client,
    "home",
    "Bootstrap Home v1"
  );

  for (const section of marketingBootstrap.homeSections) {
    const sectionId = await upsertPageSection(client, homeVersionId, section);

    await upsertPageSectionPresentation(client, sectionId, "mobile", {
      density: "compact",
      sectionKey: section.sectionKey,
    });
    await upsertPageSectionPresentation(client, sectionId, "tablet", {
      density: "balanced",
      sectionKey: section.sectionKey,
    });
    await upsertPageSectionPresentation(client, sectionId, "desktop", {
      density: "expanded",
      sectionKey: section.sectionKey,
    });

    const bindings = [];

    if (section.sectionType === "hero" && section.settings.featuredProductId) {
      bindings.push({
        entityType: "product",
        entityId: productIds.get(section.settings.featuredProductId),
        bindingKey: "featured_product",
        sortOrder: 0,
      });
    }

    if (section.sectionType === "featured_products") {
      marketingBootstrap.products.forEach((product, index) => {
        bindings.push({
          entityType: "product",
          entityId: productIds.get(product.id),
          bindingKey: "product",
          sortOrder: index,
          metadata: { categoryId: product.categoryId },
        });
      });
    }

    await resetPageSectionBindings(client, sectionId, bindings);
  }
}
