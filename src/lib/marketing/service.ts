import "server-only";

import { cache } from "react";
import { marketingBootstrap } from "@/lib/marketing/bootstrap";
import { createMarketingSnapshot, type MarketingSnapshot } from "@/lib/marketing/snapshot";
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
import { type PublishedPageSection } from "@/lib/db/types";

function getBootstrapSnapshot() {
  return createMarketingSnapshot(marketingBootstrap, "bootstrap");
}

function readSetting<T>(settings: Map<string, unknown>, key: string, fallback: T) {
  const value = settings.get(key);

  return value !== undefined ? (value as T) : fallback;
}

// Use a shared cache key that includes the version type
export const getMarketingSnapshot = cache(async (mode: "published" | "draft" = "published"): Promise<MarketingSnapshot> => {
  if (!isDatabaseConfigured()) {
    return getBootstrapSnapshot();
  }

  try {
    let sectionRows: PublishedPageSection[] = [];
    
    // Fetch sections based on mode
    if (mode === "draft") {
      const draftDetail = await getLayoutDraftDetail("home");
      if (draftDetail) {
        sectionRows = await getPageSectionsByVersion(draftDetail.version.versionId);
      } else {
        sectionRows = await getPublishedPageSections("home");
      }
    } else {
      sectionRows = await getPublishedPageSections("home");
    }

    const [categories, products, ingredients, settingRows] =
      await Promise.all([
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
          .filter((ingredient) => ingredient.image)
          .map((ingredient) => ({
            ...ingredient,
            image: ingredient.image ?? "",
          })),
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
});
