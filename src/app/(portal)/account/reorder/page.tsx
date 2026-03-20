import { ScaffoldPage } from "@/components/shell/ScaffoldPage";

export default function ReorderPage() {
  return (
    <ScaffoldPage
      badge="Reorder"
      title="Repeat purchases should be faster than first purchases."
      description="This route will convert previous orders into a clean, validated cart while respecting current prices and availability."
      primaryAction={{ href: "/account/orders", label: "Open Order History" }}
      secondaryAction={{ href: "/", label: "Back To Storefront" }}
      summary={[
        {
          label: "Source",
          value: "Past Orders",
          detail: "Reorder begins with historical baskets, not a separate wishlist model.",
        },
        {
          label: "Validation",
          value: "Current",
          detail: "Reorder checks live availability and current pricing before cart creation.",
        },
        {
          label: "Outcome",
          value: "Fast Checkout",
          detail: "The result is a ready-to-confirm cart, not a fragile duplicate order copy.",
        },
      ]}
      sections={[
        {
          title: "Business Logic",
          description: "Reorder should be trustworthy instead of pretending nothing changed.",
          items: [
            "Unavailable items flagged clearly",
            "Changed prices shown before checkout",
            "Replacement or omission notices where needed",
          ],
        },
        {
          title: "Portal Fit",
          description: "This route exists because repeat buying matters operationally and commercially.",
          items: [
            "One-tap basket recreation",
            "Fast transition into checkout",
            "Reduced friction for loyal customers",
          ],
        },
        {
          title: "Data Contract",
          description: "Reorder builds from order snapshots but validates against current variants.",
          items: [
            "Historical line item snapshots",
            "Current variant availability",
            "Fresh cart creation with current totals",
          ],
        },
      ]}
    />
  );
}
