import { Boxes, FlaskConical, Link2, Shapes } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { TaxonomyComposerForm } from "@/components/admin/catalog/TaxonomyComposerForm";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  listAdminCatalogCategoryDetails,
  listAdminCatalogIngredients,
} from "@/lib/db/repositories/catalog-admin-repository";

export default async function AdminNewTaxonomyPage() {
  await requireAdminSession("/admin/catalog/taxonomy/new");
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
      <WorkspaceContextPanel
        title="New Taxonomy"
        tags={[{ label: "Draft", tone: "muted" }]}
      />

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
            label: "Linked",
            value: `${linkedCategories + linkedIngredients}`,
            detail: "In use",
            icon: Link2,
          },
        ]}
        columns={4}
      />

      <TaxonomyComposerForm />
    </div>
  );
}
