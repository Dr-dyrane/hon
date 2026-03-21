import { notFound } from "next/navigation";
import { ImageIcon, Layers3, Package2, WalletCards } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { ProductEditorForm } from "@/components/admin/catalog/ProductEditorForm";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { formatNgn } from "@/lib/commerce";
import {
  getAdminCatalogProductDetail,
  listAdminCatalogProductMedia,
  listAdminCatalogCategories,
} from "@/lib/db/repositories/catalog-admin-repository";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const [product, categories, media] = await Promise.all([
    getAdminCatalogProductDetail(productId),
    listAdminCatalogCategories(),
    listAdminCatalogProductMedia(productId),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <WorkspaceContextPanel
        title={product.productMarketingName || product.productName}
        detail={product.productTagline || undefined}
        tags={[
          { label: product.status },
          { label: product.isAvailable ? "Live" : "Hidden" },
          ...(product.merchandisingState === "featured"
            ? [{ label: "Featured", tone: "success" as const }]
            : []),
        ]}
        meta={[
          { label: "SKU", value: product.sku },
          { label: "Category", value: product.categoryName ?? "Unsorted" },
          { label: "Variant", value: product.variantName },
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
            label: "Stock",
            value: `${product.inventoryOnHand ?? 0}`,
            detail: product.reorderThreshold
              ? `Alert ${product.reorderThreshold}`
              : "Open",
            icon: Package2,
          },
          {
            label: "Ingredients",
            value: `${product.ingredientCount}`,
            detail: "Linked",
            icon: Layers3,
            tone: "success",
          },
          {
            label: "Media",
            value: `${product.mediaCount}`,
            detail: "Assets",
            icon: ImageIcon,
          },
        ]}
        columns={4}
      />

      <ProductEditorForm
        product={product}
        categories={categories}
        media={media}
        variantTarget={{
          variantId: product.variantId,
          variantName: product.variantName,
        }}
      />
    </div>
  );
}
