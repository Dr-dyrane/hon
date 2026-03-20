import { ProductComposerForm } from "@/components/admin/catalog/ProductComposerForm";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { listAdminCatalogCategories } from "@/lib/db/repositories/catalog-admin-repository";

export default async function AdminNewProductPage() {
  const categories = await listAdminCatalogCategories();

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <WorkspaceContextPanel
        title="Product setup"
        detail="Name, price, category."
        tags={[{ label: "Draft", tone: "muted" }]}
      />

      <ProductComposerForm categories={categories} />
    </div>
  );
}
