import Link from "next/link";
import { FileStack, LayoutTemplate, Package2, Plus, Sparkles, Store } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { CatalogProductBoard } from "@/components/admin/catalog/CatalogProductBoard";
import { listAllAdminCatalogProducts } from "@/lib/db/repositories/catalog-admin-repository";

export default async function AdminProductsPage() {
  const products = await listAllAdminCatalogProducts();
  const liveProducts = products.filter((product) => product.isAvailable);
  const featuredProducts = products.filter(
    (product) => product.merchandisingState === "featured"
  );
  const draftProducts = products.filter((product) => product.status === "draft");

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <header className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 min-[1500px]:flex-row min-[1500px]:items-end min-[1500px]:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary-label">
              Catalog
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-display text-label md:text-5xl">
              Products
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/layout"
              className="flex min-h-[42px] items-center gap-2 rounded-[20px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-all hover:bg-system-fill/58"
            >
              <LayoutTemplate size={15} />
              <span>Layout</span>
            </Link>
            <Link
              href="/admin/catalog/products/new"
              className="button-primary min-h-[42px] gap-2 px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
            >
              <Plus size={15} />
              <span>New</span>
            </Link>
          </div>
        </div>
      </header>

      <MetricRail
        items={[
          {
            label: "Products",
            value: products.length.toString(),
            detail: `${liveProducts.length} on`,
            icon: Package2,
          },
          {
            label: "Live",
            value: liveProducts.length.toString(),
            detail: "On",
            icon: Store,
            tone: "success",
          },
          {
            label: "Featured",
            value: featuredProducts.length.toString(),
            detail: "Home",
            icon: Sparkles,
          },
          {
            label: "Drafts",
            value: draftProducts.length.toString(),
            detail: "Open",
            icon: FileStack,
          },
        ]}
        columns={4}
      />

      <CatalogProductBoard products={products} />
    </div>
  );
}
