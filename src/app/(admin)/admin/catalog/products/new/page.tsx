import { FileStack, Package2, Shapes, Store } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { ProductComposerForm } from "@/components/admin/catalog/ProductComposerForm";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { isStorefrontVisibleProduct } from "@/lib/catalog/storefront";
import {
  listAdminCatalogCategories,
  listAllAdminCatalogProducts,
} from "@/lib/db/repositories/catalog-admin-repository";

export default async function AdminNewProductPage() {
  const [categories, products] = await Promise.all([
    listAdminCatalogCategories(),
    listAllAdminCatalogProducts(),
  ]);
  const liveProducts = products.filter((product) => isStorefrontVisibleProduct(product)).length;
  const draftProducts = products.filter((product) => product.status === "draft").length;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <WorkspaceContextPanel
        title="New Product"
        tags={[{ label: "Draft", tone: "muted" }]}
      />

      <MetricRail
        items={[
          {
            label: "Products",
            value: `${products.length}`,
            detail: `${liveProducts} on`,
            icon: Package2,
          },
          {
            label: "Categories",
            value: `${categories.length}`,
            detail: "Ready",
            icon: Shapes,
          },
          {
            label: "Live",
            value: `${liveProducts}`,
            detail: "On",
            icon: Store,
            tone: "success",
          },
          {
            label: "Drafts",
            value: `${draftProducts}`,
            detail: "Open",
            icon: FileStack,
          },
        ]}
        columns={4}
      />

      <ProductComposerForm categories={categories} />
    </div>
  );
}
