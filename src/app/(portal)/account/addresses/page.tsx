import { ScaffoldPage } from "@/components/shell/ScaffoldPage";

export default function AddressesPage() {
  return (
    <ScaffoldPage
      badge="Addresses"
      title="Saved delivery places."
      description="Address management is intentionally separated from checkout so returning customers can keep delivery details clean without friction."
      primaryAction={{ href: "/account/profile", label: "Edit Profile" }}
      summary={[
        {
          label: "Shape",
          value: "Grouped",
          detail: "The final UI will use grouped rows and sheet-based editing in the HIG style.",
        },
        {
          label: "Data",
          value: "Validated",
          detail: "Phone, city, and location fields remain operationally useful for dispatch.",
        },
        {
          label: "Default",
          value: "One",
          detail: "One address can be promoted to default for faster checkout.",
        },
      ]}
      sections={[
        {
          title: "Stored Fields",
          description: "Addresses are richer than simple form text because delivery needs context.",
          items: [
            "Recipient name and phone",
            "Street, city, area, and landmark",
            "Optional coordinates for improved dispatch accuracy",
          ],
        },
        {
          title: "Checkout Relationship",
          description: "Saved addresses accelerate checkout but do not replace order snapshots.",
          items: [
            "Default address preloads into checkout",
            "Order keeps its own address snapshot",
            "Later edits do not rewrite historical orders",
          ],
        },
        {
          title: "Portal Intent",
          description: "This route exists so the account flow remains complete from day one of implementation.",
          items: [
            "Create address",
            "Edit address",
            "Set default address",
          ],
        },
      ]}
    />
  );
}
