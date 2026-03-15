export const BRAND = {
  name: "House of Prax",
  shorthand: "HOP",
  tagline: "Natural Energy – Engineered for Performance",
  subtext: "Premium plant-based nutrition and wellness shots designed for the uncompromising athlete.",
  contact: {
    whatsapp: ["08060785487", "07019719537"],
    instagram: "house_of_prax"
  }
};

export const NAVIGATION = [
  { label: "The System", href: "#solution" },
  { label: "Products", href: "#shop" },
  { label: "Ingredients", href: "#ingredients" },
  { label: "Experience", href: "#lifestyle" },
  { label: "Trust", href: "#social" },
];

export const CATEGORIES = [
  { id: "protein", name: "Protein Powders" },
  { id: "shots", name: "Health Shots" },
  { id: "specialty", name: "Specialty" }
];

export const PRODUCTS = {
  protein_chocolate: {
    category: "protein",
    name: "Plant-Based Protein",
    flavor: "Chocolate",
    description: "Multi-source plant protein with 18g protein and 0g sugar per serving.",
    price: 54.99,
    stats: { protein: "18g", calories: "120", sugar: "0g" },
    ingredients: ["Soy Protein", "Peanut", "Flaxseed", "Sunflower Protein", "Pumpkin Seed", "Oat Protein", "Chia Seed"],
    image: "/images/products/protein_chocolate.png"
  },
  soy_powder: {
    category: "specialty",
    name: "Organic Soybean Powder",
    description: "Pure, natural nourishment. 100% organic soybean powder for daily vitality.",
    price: 24.99,
    stats: { weight: "200g", organic: "100%" },
    ingredients: ["100% Organic Soybeans"],
    image: "/images/products/soy_powder.png"
  },
  shot_glow: {
    category: "shots",
    name: "Health Shot: Glow",
    description: "Rich in Vitamin C and anti-inflammatories to brighten skin and strengthen immunity.",
    price: 5.99,
    ingredients: ["Carrot", "Ginger", "Turmeric", "Orange", "Lime", "Black Pepper"],
    image: "/images/products/shot_glow.png"
  },
  shot_immunity: {
    category: "shots",
    name: "Health Shot: Immunity / Detox",
    description: "Antimicrobial boost to flush out toxins and empower your immune system.",
    price: 5.99,
    ingredients: ["Turmeric", "Ginger", "Cinnamon", "Garlic", "Clove", "Honey", "ACV"],
    image: "/images/products/shot_immunity.png"
  },
  shot_metabolism: {
    category: "shots",
    name: "Health Shot: Metabolism",
    description: "Promotes gut health and kick-starts digestion with natural probiotics.",
    price: 5.99,
    ingredients: ["Mint", "Pineapple", "Cucumber", "Spinach", "Chia Seed", "Lime", "Probiotic"],
    image: "/images/products/shot_metabolism.png"
  }
};

export const BENEFITS = [
  {
    title: "100% Organic",
    description: "Cleanest sources, zero chemical fillers or artificial additives.",
    icon: "Leaf",
  },
  {
    title: "Gut Health First",
    description: "Probiotics and plant enzymes for peak nutrient absorption.",
    icon: "Activity",
  },
  {
    title: "Performance Fuel",
    description: "18g protein per serving to support muscle and recovery.",
    icon: "Zap",
  },
  {
    title: "Zero Compromise",
    description: "No added sugar. Pure natural energy that lasts.",
    icon: "Wind",
  },
];

export const INGREDIENTS = [
  { name: "Soy Bean Protein", detail: "Complete amino acid profile for muscle synthesis.", image: "/images/ingredients/soy.png" },
  { name: "Flaxseed", detail: "Rich in omega-3 fatty acids and fiber for heart health.", image: "/images/ingredients/flaxseed.png" },
  { name: "Peanut", detail: "Natural protein source with healthy fats and sustained energy.", image: "/images/ingredients/peanut.png" },
  { name: "Sunflower Protein", detail: "Plant-based protein rich in B vitamins and minerals.", image: "/images/ingredients/sunflower.png" },
  { name: "Oat Protein", detail: "Slow-digesting carbs for sustained energy release.", image: "/images/ingredients/oat.png" },
  { name: "Pumpkin Seed", detail: "Magnesium-rich protein for muscle recovery.", image: "/images/ingredients/pumpkin.png" },
  { name: "Chia Seeds", detail: "Omega-3 fatty acids and sustained hydration.", image: "/images/ingredients/chia.png" },
];

export const SOCIAL_PROOF = {
  rating: 4.9,
  servings: "25,000+",
  trustedBy: "Elite Athletes & Wellness Seekers",
};
