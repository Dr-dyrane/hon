import { notFound } from "next/navigation";
import { FlaskConical, Hash, Link2, Shapes } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import {
  TaxonomyEditorForm,
  type TaxonomyEditorTarget,
} from "@/components/admin/catalog/TaxonomyEditorForm";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  getAdminCatalogCategoryDetail,
  getAdminCatalogIngredientDetail,
} from "@/lib/db/repositories/catalog-admin-repository";

export default async function AdminTaxonomyDetailPage({
  params,
}: {
  params: Promise<{ taxonomyType: string; taxonomyId: string }>;
}) {
  const { taxonomyType, taxonomyId } = await params;

  if (taxonomyType !== "category" && taxonomyType !== "ingredient") {
    notFound();
  }

  await requireAdminSession(`/admin/catalog/taxonomy/${taxonomyType}/${taxonomyId}`);

  let target: TaxonomyEditorTarget | null = null;

  if (taxonomyType === "category") {
    const category = await getAdminCatalogCategoryDetail(taxonomyId);

    if (!category) {
      notFound();
    }

    target = { taxonomyType: "category", category };
  } else {
    const ingredient = await getAdminCatalogIngredientDetail(taxonomyId);

    if (!ingredient) {
      notFound();
    }

    target = { taxonomyType: "ingredient", ingredient };
  }

  const linkedCount =
    target.taxonomyType === "category"
      ? target.category.productCount
      : target.ingredient.variantCount;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <WorkspaceContextPanel
        title={
          target.taxonomyType === "category"
            ? target.category.categoryName
            : target.ingredient.ingredientName
        }
        detail={
          target.taxonomyType === "ingredient"
            ? target.ingredient.detail
            : "Store category for product organization."
        }
        tags={[
          { label: target.taxonomyType === "category" ? "Category" : "Ingredient" },
          {
            label: linkedCount > 0 ? "Linked" : "Ready",
            tone: linkedCount > 0 ? "default" : "success",
          },
        ]}
        meta={
          target.taxonomyType === "category"
            ? [
                { label: "Slug", value: target.category.categorySlug },
                { label: "Sort", value: `${target.category.sortOrder}` },
                { label: "Products", value: `${target.category.productCount}` },
              ]
            : [
                { label: "Slug", value: target.ingredient.ingredientSlug },
                { label: "Sort", value: `${target.ingredient.sortOrder}` },
                { label: "Products", value: `${target.ingredient.productCount}` },
              ]
        }
      />

      <MetricRail
        items={
          target.taxonomyType === "category"
            ? [
                {
                  label: "Category",
                  value: "1",
                  detail: target.category.categorySlug,
                  icon: Shapes,
                },
                {
                  label: "Products",
                  value: `${target.category.productCount}`,
                  detail: target.category.productCount > 0 ? "Linked" : "None",
                  icon: Link2,
                  tone: target.category.productCount > 0 ? "success" : "default",
                },
                {
                  label: "Sort",
                  value: `${target.category.sortOrder}`,
                  detail: "Order",
                  icon: Hash,
                },
                {
                  label: "Type",
                  value: "Category",
                  detail: "Taxonomy",
                  icon: Shapes,
                },
              ]
            : [
                {
                  label: "Ingredient",
                  value: "1",
                  detail: target.ingredient.ingredientSlug,
                  icon: FlaskConical,
                },
                {
                  label: "Products",
                  value: `${target.ingredient.productCount}`,
                  detail: "Linked",
                  icon: Link2,
                  tone: target.ingredient.productCount > 0 ? "success" : "default",
                },
                {
                  label: "Variants",
                  value: `${target.ingredient.variantCount}`,
                  detail: "Linked",
                  icon: Link2,
                  tone: target.ingredient.variantCount > 0 ? "success" : "default",
                },
                {
                  label: "Sort",
                  value: `${target.ingredient.sortOrder}`,
                  detail: "Order",
                  icon: Hash,
                },
              ]
        }
        columns={4}
      />

      <TaxonomyEditorForm target={target} />
    </div>
  );
}
