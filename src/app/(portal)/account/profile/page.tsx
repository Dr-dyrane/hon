import { ScaffoldPage } from "@/components/shell/ScaffoldPage";

export default function ProfilePage() {
  return (
    <ScaffoldPage
      badge="Profile"
      title="Identity, phone, and preferences."
      description="The profile route will become the central place for customer identity maintenance while still keeping phone number mandatory for the delivery business model."
      primaryAction={{ href: "/account", label: "Back To Account Home" }}
      summary={[
        {
          label: "Phone",
          value: "Required",
          detail: "Phone remains mandatory business data even though auth is email-OTP only.",
        },
        {
          label: "Auth",
          value: "Email OTP",
          detail: "Identity stays simple without password-reset overhead in the launch system.",
        },
        {
          label: "Guest Claim",
          value: "Supported",
          detail: "Claimed guest orders will hydrate this profile over time.",
        },
      ]}
      sections={[
        {
          title: "Core Profile",
          description: "Only store what the business and the customer experience truly need.",
          items: [
            "Full name",
            "Email address",
            "Delivery phone number",
          ],
        },
        {
          title: "Preferences",
          description: "Preference scope stays intentionally light at launch.",
          items: [
            "Marketing opt-in",
            "Order communication defaults",
            "Default address linkage",
          ],
        },
        {
          title: "Governance",
          description: "Profile data remains customer-owned and subject to ownership-checked reads.",
          items: [
            "Portal-only self access",
            "Admin support lookup",
            "No client-side source-of-truth duplication",
          ],
        },
      ]}
    />
  );
}
