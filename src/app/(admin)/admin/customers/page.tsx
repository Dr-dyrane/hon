import { ScaffoldPage } from "@/components/shell/ScaffoldPage";

export default function AdminCustomersPage() {
  return (
    <ScaffoldPage
      badge="Customers"
      title="Customer lookup and support context."
      description="This route will provide the support-side view of profiles, guest conversion, addresses, and order history without needing external tools."
      primaryAction={{ href: "/admin/orders", label: "Open Orders" }}
      summary={[
        {
          label: "Lookup",
          value: "Unified",
          detail: "One support surface is planned for profile, orders, and delivery context.",
        },
        {
          label: "Guest Claim",
          value: "Supported",
          detail: "Guest and account states are intentionally modeled so customer history can converge cleanly.",
        },
        {
          label: "Access",
          value: "Role-Gated",
          detail: "Support and admin read access will remain explicit and audited.",
        },
      ]}
      sections={[
        {
          title: "Support Goals",
          description: "The route should explain the full customer situation quickly.",
          items: [
            "Contact identity and saved places",
            "Recent orders and payment states",
            "Internal notes and support context",
          ],
        },
        {
          title: "Business Value",
          description: "This route reduces operational fragmentation.",
          items: [
            "Faster customer resolution",
            "Better order traceability",
            "Cleaner guest-to-account handling",
          ],
        },
        {
          title: "Design Intent",
          description: "This should feel like a focused support console, not a spreadsheet dump.",
          items: [
            "Search-first structure",
            "Detail panel on larger screens",
            "Clear navigation back into order workspaces",
          ],
        },
      ]}
    />
  );
}
