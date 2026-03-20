import { ScaffoldPage } from "@/components/shell/ScaffoldPage";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return (
    <ScaffoldPage
      badge="Product Editor"
      title={`Product ${productId}`}
      description="This route is the future product workspace for variants, media, merchandising state, inventory, and ingredient relationships."
      primaryAction={{ href: "/admin/catalog/products", label: "Back To Catalog" }}
      secondaryAction={{ href: "/admin/layout", label: "Open Layout" }}
      summary={[
        {
          label: "Editor Shape",
          value: "Grouped",
          detail: "The final editor will stay grouped by product concern rather than becoming one long flat form.",
        },
        {
          label: "Media",
          value: "S3",
          detail: "Media and proof upload flows will share direct signed-upload infrastructure.",
        },
        {
          label: "Variants",
          value: "Explicit",
          detail: "Sellable units remain separate from product families.",
        },
      ]}
      sections={[
        {
          title: "Sections",
          description: "The final editor should present a calm structure.",
          items: [
            "Identity and description",
            "Variant table and price controls",
            "Media, ingredients, and inventory",
          ],
        },
        {
          title: "Merchandising",
          description: "Catalog state feeds both store and layout systems.",
          items: [
            "Available for sale",
            "Featured ranking",
            "Binding readiness for homepage sections",
          ],
        },
        {
          title: "Validation",
          description: "A product should only become saleable when the model is coherent.",
          items: [
            "Required fields complete",
            "Default variant present when needed",
            "Media and pricing valid",
          ],
        },
      ]}
    />
  );
}
