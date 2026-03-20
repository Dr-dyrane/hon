import { ScaffoldPage } from "@/components/shell/ScaffoldPage";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { serverEnv } from "@/lib/config/server";
import { listPublishedCatalogProducts } from "@/lib/db/repositories/catalog-repository";
import { getPortalAccountSummary } from "@/lib/db/repositories/account-repository";

export default async function AccountPage() {
  const session = await requireAuthenticatedSession("/account");
  const [accountSummary, products] = await Promise.all([
    getPortalAccountSummary(session.email),
    listPublishedCatalogProducts(),
  ]);
  const availableProductCount = products.filter((product) => product.isAvailable).length;
  const featuredProductCount = products.filter(
    (product) => product.merchandisingState === "featured"
  ).length;
  const customerName =
    accountSummary.fullName ?? session.email.split("@")[0] ?? "Customer";

  return (
    <ScaffoldPage
      badge="Portal Home"
      title={`Account home for ${customerName}.`}
      description="The portal now has a live account summary path. Where no customer record exists yet, the UI stays calm and explicit rather than pretending data exists."
      primaryAction={{ href: "/account/orders", label: "View Orders" }}
      secondaryAction={{ href: "/account/profile", label: "Open Profile" }}
      summary={[
        {
          label: "Orders",
          value: accountSummary.totalOrders.toString(),
          detail:
            accountSummary.latestOrderNumber && accountSummary.latestOrderStatus
              ? `Latest order ${accountSummary.latestOrderNumber} is ${accountSummary.latestOrderStatus}.`
              : "No linked orders exist for this signed-in identity yet.",
        },
        {
          label: "Addresses",
          value: accountSummary.addressCount.toString(),
          detail: "Saved places will accumulate here once checkout writes into the account model.",
        },
        {
          label: "Auth",
          value: serverEnv.auth.mode === "email_otp" ? "Email OTP" : serverEnv.auth.mode,
          detail: "The signed-in shell is already using the planned lightweight launch auth path.",
        },
      ]}
      sections={[
        {
          title: "Order Visibility",
          description: "The account home should state the truth of the customer record clearly.",
          items: [
            accountSummary.activeOrders > 0
              ? `${accountSummary.activeOrders} active orders currently need attention.`
              : "No active orders are currently attached to this account.",
            accountSummary.latestOrderNumber
              ? `Tracking will anchor from order ${accountSummary.latestOrderNumber}.`
              : "Tracking will appear here after the first confirmed order.",
            `${accountSummary.reviewCount} reviews are currently linked to this account.`,
          ],
        },
        {
          title: "Customer Memory",
          description: "Repeat behavior should become easier without inventing fake state.",
          items: [
            accountSummary.userId
              ? "A customer identity record already exists in Aurora."
              : "No Aurora customer identity is linked to this email yet.",
            `${accountSummary.addressCount} saved addresses are ready for future checkout integration.`,
            "Guest-order claim remains part of the planned conversion path.",
          ],
        },
        {
          title: "Store Readiness",
          description: "The portal can now speak to the live storefront state too.",
          items: [
            `${availableProductCount} products are currently available for sale.`,
            `${featuredProductCount} products are currently featured on the storefront.`,
            "Portal and storefront now depend on the same seeded database source.",
          ],
        },
      ]}
    />
  );
}
