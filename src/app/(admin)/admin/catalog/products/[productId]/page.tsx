import { notFound } from "next/navigation";
import { 
  getAdminCatalogProductDetail,
} from "@/lib/db/repositories/catalog-admin-repository";
import { ProductEditorForm } from "@/components/admin/catalog/ProductEditorForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatNgn } from "@/lib/commerce";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getAdminCatalogProductDetail(productId);

  if (!product) {
    notFound();
  }

  const isDraft = product.status === "draft";
  const isAvailable = product.isAvailable;

  return (
    <div className="space-y-10">
      {/* Navigation & Header */}
      <header className="flex flex-col gap-6">
        <Link 
          href="/admin/catalog/products" 
          className="group flex w-fit items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary-label transition-colors hover:text-accent"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          Back to Catalog
        </Link>
        
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${
                isDraft ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
              }`}>
                {product.status}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-tertiary-label">
                SKU: {product.sku}
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-display text-label md:text-5xl">
              {product.productMarketingName || product.productName}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-secondary-label">
              {product.productTagline || "Configure product identity, variants, and real-time inventory levels below."}
            </p>
          </div>
        </div>
      </header>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <article className="liquid-glass p-6 backdrop-blur-2xl">
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondary-label">Price</div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-label">
            {formatNgn(product.priceNgn)}
          </div>
          <p className="mt-2 text-xs text-secondary-label">
            {product.compareAtPriceNgn ? `Discounted from ${formatNgn(product.compareAtPriceNgn)}` : "Standard catalog pricing"}
          </p>
        </article>

        <article className="liquid-glass p-6 backdrop-blur-2xl">
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondary-label">Inventory</div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-label">
            {product.inventoryOnHand}
          </div>
          <p className="mt-2 text-xs text-secondary-label">
            {product.reorderThreshold ? `Alerts below ${product.reorderThreshold}` : "No reorder alert set"}
          </p>
        </article>

        <article className="liquid-glass p-6 backdrop-blur-2xl">
          <div className="text-[10px] font-bold uppercase tracking-widest text-secondary-label">Visibility</div>
          <div className="mt-3 text-3xl font-bold tracking-tight text-label">
            {isAvailable ? "Live" : "Hidden"}
          </div>
          <p className="mt-2 text-xs text-secondary-label">
            {product.merchandisingState === "featured" ? "Promoted on homepage" : "Standard catalog placement"}
          </p>
        </article>
      </div>

      {/* Main Editor */}
      <ProductEditorForm product={product} />
    </div>
  );
}
