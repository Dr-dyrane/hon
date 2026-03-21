import type {
  CategoryId,
  IngredientId,
  MarketingBenefit,
  MarketingBootstrap,
  MarketingBrand,
  MarketingCategory,
  MarketingHomeSection,
  MarketingNavItem,
  MarketingProduct,
  MarketingSocialProof,
  ProductId,
} from "@/lib/marketing/types";
import { isStorefrontVisibleProduct } from "@/lib/catalog/storefront";

export type MarketingSnapshot = {
  source: "bootstrap" | "database";
  brand: MarketingBrand;
  navigation: MarketingNavItem[];
  benefits: MarketingBenefit[];
  socialProof: MarketingSocialProof;
  categories: MarketingCategory[];
  categoriesById: Record<CategoryId, MarketingCategory>;
  products: MarketingProduct[];
  productsById: Record<ProductId, MarketingProduct>;
  productIds: ProductId[];
  ingredients: MarketingBootstrap["ingredients"];
  ingredientsById: Record<IngredientId, MarketingBootstrap["ingredients"][number]>;
  homeSections: MarketingHomeSection[];
  homeSectionsByKey: Record<string, MarketingHomeSection>;
};

export function createMarketingSnapshot(
  bootstrap: Omit<MarketingBootstrap, never>,
  source: MarketingSnapshot["source"]
): MarketingSnapshot {
  const categories = [...bootstrap.categories].sort(
    (left, right) => left.sortOrder - right.sortOrder
  );
  const products = [...bootstrap.products]
    .filter((product) => isStorefrontVisibleProduct(product))
    .sort((left, right) => {
      if (left.categoryId !== right.categoryId) {
        return left.categoryId.localeCompare(right.categoryId);
      }

      return left.sortOrder - right.sortOrder;
    });
  const ingredients = [...bootstrap.ingredients].sort(
    (left, right) => left.sortOrder - right.sortOrder
  );
  const homeSections = [...bootstrap.homeSections]
    .filter((section) => section.isEnabled)
    .sort((left, right) => left.sortOrder - right.sortOrder);

  return {
    source,
    brand: bootstrap.brand,
    navigation: bootstrap.navigation,
    benefits: bootstrap.benefits,
    socialProof: bootstrap.socialProof,
    categories,
    categoriesById: Object.fromEntries(
      categories.map((category) => [category.id, category])
    ),
    products,
    productsById: Object.fromEntries(products.map((product) => [product.id, product])),
    productIds: products.map((product) => product.id),
    ingredients,
    ingredientsById: Object.fromEntries(
      ingredients.map((ingredient) => [ingredient.id, ingredient])
    ),
    homeSections,
    homeSectionsByKey: Object.fromEntries(
      homeSections.map((section) => [section.sectionKey, section])
    ),
  };
}
