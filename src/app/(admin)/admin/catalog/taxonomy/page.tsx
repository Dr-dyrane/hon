import Link from "next/link";
import {
  Boxes,
  FlaskConical,
  FolderTree,
  PackageSearch,
  Plus,
  Shapes,
} from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { TaxonomyBoard } from "@/components/admin/catalog/TaxonomyBoard";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  listAdminCatalogCategoryDetails,
  listAdminCatalogIngredients,
} from "@/lib/db/repositories/catalog-admin-repository";

export default async function AdminCatalogTaxonomyPage() {
  await requireAdminSession("/admin/catalog/taxonomy");
  const [categories, ingredients] = await Promise.all([
    listAdminCatalogCategoryDetails(),
    listAdminCatalogIngredients(),
  ]);

  const linkedCategories = categories.filter(
    (category) => category.productCount > 0
  ).length;
  const linkedIngredients = ingredients.filter(
    (ingredient) => ingredient.variantCount > 0
  ).length;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <header className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 min-[1500px]:flex-row min-[1500px]:items-end min-[1500px]:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary-label">
              Catalog
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-display text-label md:text-5xl">
              Taxonomy
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/catalog/products"
              className="flex min-h-[42px] items-center gap-2 rounded-[20px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-all hover:bg-system-fill/58"
            >
              <PackageSearch size={15} />
              <span>Products</span>
            </Link>
            <Link
              href="/admin/catalog/taxonomy/new"
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
            label: "Entries",
            value: `${categories.length + ingredients.length}`,
            detail: "Total",
            icon: Boxes,
          },
          {
            label: "Categories",
            value: `${categories.length}`,
            detail: `${linkedCategories} linked`,
            icon: Shapes,
          },
          {
            label: "Ingredients",
            value: `${ingredients.length}`,
            detail: `${linkedIngredients} linked`,
            icon: FlaskConical,
            tone: "success",
          },
          {
            label: "In Use",
            value: `${linkedCategories + linkedIngredients}`,
            detail: "Linked",
            icon: FolderTree,
          },
        ]}
        columns={4}
      />

      <TaxonomyBoard categories={categories} ingredients={ingredients} />
    </div>
  );
}
