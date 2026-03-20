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
import { getPublishedPageSections } from "@/lib/db/repositories/layout-repository";
import { isDatabaseConfigured } from "@/lib/db/client";

function getBootstrapSnapshot() {
  return createMarketingSnapshot(marketingBootstrap, "bootstrap");
}

function readSetting<T>(settings: Map<string, unknown>, key: string, fallback: T) {
  const value = settings.get(key);

  return value !== undefined ? (value as T) : fallback;
}

export const getMarketingSnapshot = cache(async (): Promise<MarketingSnapshot> => {
  if (!isDatabaseConfigured()) {
    return getBootstrapSnapshot();
  }

  try {
    const [categories, products, ingredients, sectionRows, settingRows] =
      await Promise.all([
        listMarketingCategories(),
        listMarketingProducts(),
        listMarketingIngredients(),
        getPublishedPageSections("home"),
        listMarketingSiteSettings([
          "marketing_brand",
          "marketing_navigation",
          "marketing_benefits",
          "marketing_social_proof",
        ]),
      ]);

    if (
      categories.length === 0 ||
      products.length === 0 ||
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
        products: products
          .filter((product) => product.image && product.model)
          .map((product) => ({
            ...product,
            flavor: product.flavor ?? undefined,
            image: product.image ?? "",
            model: product.model ?? "",
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
