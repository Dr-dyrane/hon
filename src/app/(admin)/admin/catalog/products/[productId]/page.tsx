import { notFound } from "next/navigation";
import { Eye, Package2, WalletCards } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { ProductEditorForm } from "@/components/admin/catalog/ProductEditorForm";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { formatNgn } from "@/lib/commerce";
import {
  getAdminCatalogProductDetail,
  listAdminCatalogCategories,
} from "@/lib/db/repositories/catalog-admin-repository";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const [product, categories] = await Promise.all([
    getAdminCatalogProductDetail(productId),
    listAdminCatalogCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <WorkspaceContextPanel
        title={product.productMarketingName || product.productName}
        detail={product.productTagline || "Edit, stock, publish."}
        tags={[
          { label: product.status },
          { label: `SKU ${product.sku}`, tone: "muted" },
        ]}
      />

      <MetricRail
        items={[
          {
            label: "Price",
            value: formatNgn(product.priceNgn),
            detail: product.compareAtPriceNgn
              ? `From ${formatNgn(product.compareAtPriceNgn)}`
              : "Base",
            icon: WalletCards,
          },
          {
            label: "Inventory",
            value: `${product.inventoryOnHand ?? 0}`,
            detail: product.reorderThreshold
              ? `Alert ${product.reorderThreshold}`
              : "No alert",
            icon: Package2,
          },
          {
            label: "Visibility",
            value: product.isAvailable ? "Live" : "Hidden",
            detail:
              product.merchandisingState === "featured"
                ? "Featured"
                : product.merchandisingState,
            icon: Eye,
            tone: product.isAvailable ? "success" : "default",
          },
        ]}
        columns={3}
      />

      <ProductEditorForm product={product} categories={categories} />
    </div>
  );
}
