export const BRAND = {
  name: "House of Prax",
  shorthand: "HOP",
  tagline: "Clean Plant Protein – Built for Real Training",
  subtext: "Plant-based protein designed for strength, recovery, and everyday performance.",
};

export const NAVIGATION = [
  { label: "The System", href: "#solution" },
  { label: "Benefits", href: "#benefits" },
  { label: "Ingredients", href: "#ingredients" },
  { label: "Experience", href: "#lifestyle" },
  { label: "Reviews", href: "#social" },
];

export const FLAVORS = {
  chocolate: {
    name: "Chocolate",
    description: "Rich, smooth, classic.",
    accent: "bg-[#4A2C2A]",
  },
  vanilla: {
    name: "Vanilla",
    description: "Light, clean, versatile.",
    accent: "bg-[#F3E5AB]",
  },
};

export const BENEFITS = [
  {
    title: "Clean Energy",
    description: "Fuel workouts without heavy digestion.",
    icon: "Zap",
  },
  {
    title: "Smooth Digestion",
    description: "Plant protein that’s gentle on the stomach.",
    icon: "Wind",
  },
  {
    title: "High Protein",
    description: "Support muscle growth and recovery.",
    icon: "Activity",
  },
  {
    title: "Naturally Flavored",
    description: "No artificial aftertaste.",
    icon: "Leaf",
  },
];

export const INGREDIENTS = [
  { name: "Pea Protein", detail: "Bioavailable amino acids for muscle repair.", image: "/images/ingredients/pea.png" },
  { name: "Brown Rice Protein", detail: "Clean, sustainable source of energy.", image: "/images/ingredients/rice.png" },
  { name: "Cocoa", detail: "Natural antioxidants and rich flavor.", image: "/images/ingredients/cocoa.png" },
  { name: "Natural Flavors", detail: "Pure essence, nothing synthetic.", image: "/images/ingredients/pea.png" }, // Reusing pea for natural flavors as it's often extracted from plants
];

export const TRUST_INDICATORS = [
  { label: "Clean Ingredients", icon: "Clean" },
  { label: "Plant-Based", icon: "Plant" },
  { label: "Easy Digestion", icon: "Digestion" },
  { label: "Zero Additives", icon: "Clean" },
];

export const SOCIAL_PROOF = {
  rating: 4.8,
  servings: "10,000+",
  trustedBy: "Athletes Worldwide",
};
