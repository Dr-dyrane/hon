import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { marketingBootstrap } from "@/lib/marketing/bootstrap";
import { MARKETING_SNAPSHOT_TAG } from "@/lib/marketing/cache";
import { createMarketingSnapshot, type MarketingSnapshot } from "@/lib/marketing/snapshot";
import type { IngredientProfile } from "@/lib/marketing/types";
import {
  listMarketingCategories,
  listMarketingIngredients,
  listMarketingProducts,
  listMarketingSiteSettings,
} from "@/lib/db/repositories/marketing-repository";
import { 
  getPublishedPageSections, 
  getPageSectionsByVersion, 
  getLayoutDraftDetail 
} from "@/lib/db/repositories/layout-repository";
import { isDatabaseConfigured } from "@/lib/db/client";

function getBootstrapSnapshot() {
  return createMarketingSnapshot(marketingBootstrap, "bootstrap");
}

async function getHomeSectionRows(mode: "published" | "draft") {
  if (mode === "draft") {
    const draftDetail = await getLayoutDraftDetail("home");

    if (draftDetail) {
      return getPageSectionsByVersion(draftDetail.version.versionId);
    }
  }

  return getPublishedPageSections("home");
}

function readSetting<T>(settings: Map<string, unknown>, key: string, fallback: T) {
  const value = settings.get(key);

  return value !== undefined ? (value as T) : fallback;
}

function normalizeIngredientToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function createBootstrapIngredientImageLookup() {
  const lookup = new Map<string, string>();

  for (const ingredient of marketingBootstrap.ingredients) {
    const keys = [ingredient.id, ingredient.name, ...ingredient.aliases];

    for (const rawKey of keys) {
      const key = normalizeIngredientToken(rawKey);

      if (key && !lookup.has(key)) {
        lookup.set(key, ingredient.image);
      }
    }
  }

  return lookup;
}

function createBootstrapIngredientProfileLookup() {
  const lookup = new Map<string, IngredientProfile>();

  for (const ingredient of marketingBootstrap.ingredients) {
    const keys = [ingredient.id, ingredient.name, ...ingredient.aliases];

    for (const rawKey of keys) {
      const key = normalizeIngredientToken(rawKey);

      if (key && !lookup.has(key)) {
        lookup.set(key, ingredient);
      }
    }
  }

  return lookup;
}

function resolveIngredientImage(
  ingredient: {
    id: string;
    name: string;
    aliases: string[];
    image: string | null;
  },
  lookup: Map<string, string>
) {
  if (ingredient.image) {
    return ingredient.image;
  }

  const candidates = [ingredient.id, ingredient.name, ...ingredient.aliases];

  for (const candidate of candidates) {
    const key = normalizeIngredientToken(candidate);
    const match = key ? lookup.get(key) : null;

    if (match) {
      return match;
    }
  }

  return null;
}

function resolveIngredientProfile(
  ingredient: {
    id: string;
    name: string;
    aliases: string[];
  },
  lookup: Map<string, IngredientProfile>
) {
  const candidates = [ingredient.id, ingredient.name, ...ingredient.aliases];

  for (const candidate of candidates) {
    const key = normalizeIngredientToken(candidate);
    const match = key ? lookup.get(key) : null;

    if (match) {
      return match;
    }
  }

  return null;
}

async function buildMarketingSnapshot(
  mode: "published" | "draft" = "published"
): Promise<MarketingSnapshot> {
  if (!isDatabaseConfigured()) {
    return getBootstrapSnapshot();
  }

  try {
    const [sectionRows, categories, products, ingredients, settingRows] =
      await Promise.all([
        getHomeSectionRows(mode),
        listMarketingCategories(),
        listMarketingProducts(),
        listMarketingIngredients(),
        listMarketingSiteSettings([
          "marketing_brand",
          "marketing_navigation",
          "marketing_benefits",
          "marketing_social_proof",
        ]),
      ]);

    if (
      categories.length === 0 ||
      ingredients.length === 0 ||
      sectionRows.length === 0
    ) {
      return getBootstrapSnapshot();
    }

    const settings = new Map(settingRows.map((entry) => [entry.key, entry.value]));

    const bootstrapIngredientImageLookup = createBootstrapIngredientImageLookup();
    const bootstrapIngredientProfileLookup = createBootstrapIngredientProfileLookup();

    return createMarketingSnapshot(
      {
        brand: readSetting(settings, "marketing_brand", marketingBootstrap.brand),
        navigation: readSetting(
          settings,
          "marketing_navigation",
          marketingBootstrap.navigation
        ),
        benefits: readSetting(settings, "marketing_benefits", marketingBootstrap.benefits),
        socialProof: readSetting(
          settings,
          "marketing_social_proof",
          marketingBootstrap.socialProof
        ),
        categories,
        products: products.map((product) => ({
          ...product,
          flavor: product.flavor ?? undefined,
        })),
        ingredients: ingredients
          .map((ingredient) => {
            const image = resolveIngredientImage(
              ingredient,
              bootstrapIngredientImageLookup
            );
            const profile = resolveIngredientProfile(
              ingredient,
              bootstrapIngredientProfileLookup
            );

            if (!image) {
              return null;
            }

            return {
              ...ingredient,
              category: profile?.category ?? "Seeds",
              role: profile?.role ?? "supporting",
              benefit: profile?.benefit ?? "Functional support",
              image,
            };
          })
          .filter((ingredient): ingredient is NonNullable<typeof ingredient> =>
            Boolean(ingredient)
          ),
        homeSections: sectionRows.map((section) => ({
          sectionKey: section.sectionKey,
          sectionType: section.sectionType as MarketingSnapshot["homeSections"][number]["sectionType"],
          sortOrder: section.sortOrder,
          isEnabled: section.isEnabled,
          eyebrow: section.eyebrow,
          heading: section.heading,
          body: section.body,
          settings: section.settings,
        })),
      },
      "database"
    );
  } catch {
    return getBootstrapSnapshot();
  }
}

const getCachedPublishedMarketingSnapshot = unstable_cache(
  async () => buildMarketingSnapshot("published"),
  ["marketing-snapshot:published"],
  { tags: [MARKETING_SNAPSHOT_TAG] }
);

// Use a shared cache key that includes the version type
export const getMarketingSnapshot = cache(
  async (
    mode: "published" | "draft" = "published"
  ): Promise<MarketingSnapshot> => {
    if (mode === "draft") {
      return buildMarketingSnapshot("draft");
    }

    return getCachedPublishedMarketingSnapshot();
  }
);
