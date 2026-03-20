import { ScaffoldPage } from "@/components/shell/ScaffoldPage";
import { formatNgn } from "@/lib/commerce";
import { listAllAdminCatalogProducts } from "@/lib/db/repositories/catalog-admin-repository";

export default async function AdminProductsPage() {
  const products = await listAllAdminCatalogProducts();
  const featuredProducts = products.filter(
    (product) => product.merchandisingState === "featured"
  );
  const availableProducts = products.filter((product) => product.isAvailable);
  const powderProducts = products.filter(
    (product) => product.categoryName?.toLowerCase() === "powders"
  );
  const shotProducts = products.filter(
    (product) => product.categoryName?.toLowerCase() === "health shots"
  );

  return (
    <ScaffoldPage
      badge="Catalog"
      title="Products are now reading from Aurora."
      description="This route is no longer just a placeholder. It reflects the current seeded catalog state that the storefront can resolve through the shared data layer."
      primaryAction={{ href: "/admin/catalog/products/preview-product", label: "Open Product Editor" }}
      secondaryAction={{ href: "/admin/layout", label: "Open Layout" }}
      summary={[
        {
          label: "Products",
          value: products.length.toString(),
          detail: "All products (draft, active, archived) are now visible here to provide a complete operational view of the catalog.",
        },
        {
          label: "Available",
          value: availableProducts.length.toString(),
          detail: "Availability remains separate from featured merchandising on purpose.",
        },
        {
          label: "Featured",
          value: featuredProducts.length.toString(),
          detail: "Featured state is now measurable from the live catalog instead of being implied in static code.",
        },
      ]}
      sections={[
        {
          title: "Powder Line",
          description: "Primary products for longer-session nutrition.",
          items:
            powderProducts.length > 0
              ? powderProducts.map(
                  (product) =>
                    `${product.productMarketingName ?? product.productName}, ${formatNgn(product.priceNgn)}, ${product.ingredientCount} ingredients`
                )
              : ["No powder products are currently active."],
        },
        {
          title: "Shot Line",
          description: "Fast-turn products that later need bundle-aware operations.",
          items:
            shotProducts.length > 0
              ? shotProducts.map(
                  (product) =>
                    `${product.productName}, ${formatNgn(product.priceNgn)}, ${product.ingredientCount} ingredients`
                )
              : ["No health shots are currently active."],
        },
        {
          title: "Merchandising Control",
          description: "This is the current live business state, not aspirational copy.",
          items: products.map((product) => {
            const stateLabel = product.isAvailable ? "available" : "not available";
            return `${product.productMarketingName ?? product.productName}, ${product.merchandisingState}, ${stateLabel}`;
          }),
        },
      ]}
    />
  );
}
