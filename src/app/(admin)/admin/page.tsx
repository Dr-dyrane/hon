import { ScaffoldPage } from "@/components/shell/ScaffoldPage";
import {
  getAdminHomeLayoutSummary,
  getAdminOverviewMetrics,
} from "@/lib/db/repositories/admin-repository";
import { listAllAdminCatalogProducts } from "@/lib/db/repositories/catalog-admin-repository";
import { serverEnv } from "@/lib/config/server";

export default async function AdminPage() {
  const [metrics, layoutSummary, products] = await Promise.all([
    getAdminOverviewMetrics(),
    getAdminHomeLayoutSummary(),
    listAllAdminCatalogProducts(),
  ]);
  const featuredProducts = products
    .filter((product) => product.merchandisingState === "featured")
    .map((product) => product.productMarketingName ?? product.productName);
  const availableProducts = products
    .filter((product) => product.isAvailable)
    .map((product) => product.productMarketingName ?? product.productName);

  return (
    <ScaffoldPage
      badge="Admin Overview"
      title="Operations now have live platform context."
      description={`The admin access list starts with ${serverEnv.auth.adminEmails.join(", ")}. Aurora is now seeded, so this overview can reflect the real merchandising and layout state instead of a placeholder shell.`}
      primaryAction={{ href: "/admin/orders", label: "Open Orders" }}
      secondaryAction={{ href: "/admin/payments", label: "Open Payments" }}
      summary={[
        {
          label: "Catalog",
          value: metrics.activeProducts.toString(),
          detail: `${metrics.availableProducts} available, ${metrics.featuredProducts} featured products are currently visible to operations.`,
        },
        {
          label: "Homepage",
          value: metrics.enabledHomeSections.toString(),
          detail: `${layoutSummary.versionLabel ?? "No published version"} is live with ${metrics.homeBindingCount} active bindings.`,
        },
        {
          label: "Admins",
          value: serverEnv.auth.adminEmails.length.toString(),
          detail: "Admin identities remain explicit and centralized before deeper role models are added.",
        },
      ]}
      sections={[
        {
          title: "Merchandising State",
          description: "Catalog visibility is now coming from Aurora.",
          items:
            availableProducts.length > 0
              ? availableProducts.map((product) => `${product} is available for sale.`)
              : ["No products are currently marked available."],
        },
        {
          title: "Featured Focus",
          description: "Homepage emphasis should stay deliberate, not accidental.",
          items:
            featuredProducts.length > 0
              ? featuredProducts.map((product) => `${product} is marked featured.`)
              : ["No products are currently flagged as featured."],
        },
        {
          title: "Layout Snapshot",
          description: "The published homepage can now be read as operational state.",
          items: [
            `${layoutSummary.sectionCount} total sections are in the published home version.`,
            `${layoutSummary.bindingCount} bindings connect products into the home composition.`,
            `${metrics.homeVersionLabel ?? "No published home version"} is the current live label.`,
          ],
        },
      ]}
    />
  );
}
