export type ProductId = string;
export type IngredientId = string;
export type CategoryId = string;

export type MarketingBrand = {
  name: string;
  shorthand: string;
  tagline: string;
  subtext: string;
  contact: {
    whatsapp: string[];
    instagram: string;
  };
};

export type MarketingNavItem = {
  label: string;
  href: string;
};

export type MarketingBenefit = {
  title: string;
  description: string;
  icon: string;
};

export type MarketingSocialProof = {
  rating: number;
  servings: string;
  trustedBy: string;
};

export type MarketingCategory = {
  id: CategoryId;
  name: string;
  sortOrder: number;
};

export type MarketingProduct = {
  id: ProductId;
  categoryId: CategoryId;
  name: string;
  flavor?: string;
  description: string;
  priceNgn: number;
  stats: Record<string, string>;
  ingredients: string[];
  image: string;
  model: string;
  sortOrder: number;
  isAvailable: boolean;
  merchandisingState: "featured" | "standard" | "hidden";
};

export type IngredientProfile = {
  id: IngredientId;
  name: string;
  detail: string;
  image: string;
  aliases: string[];
  sortOrder: number;
};

export type MarketingHomeSection = {
  sectionKey: string;
  sectionType:
    | "hero"
    | "problem_statement"
    | "science_strip"
    | "benefit_grid"
    | "ingredient_story"
    | "process_steps"
    | "delivery_reassurance"
    | "lifestyle_gallery"
    | "featured_products"
    | "review_highlight"
    | "faq"
    | "final_cta";
  sortOrder: number;
  isEnabled: boolean;
  eyebrow: string | null;
  heading: string | null;
  body: string | null;
  settings: Record<string, unknown>;
};

export type MarketingBootstrap = {
  brand: MarketingBrand;
  navigation: MarketingNavItem[];
  benefits: MarketingBenefit[];
  socialProof: MarketingSocialProof;
  categories: MarketingCategory[];
  products: MarketingProduct[];
  ingredients: IngredientProfile[];
  homeSections: MarketingHomeSection[];
};
