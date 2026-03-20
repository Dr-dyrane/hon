import { ScaffoldPage } from "@/components/shell/ScaffoldPage";

export default function AdminSettingsPage() {
  return (
    <ScaffoldPage
      badge="Settings"
      title="Controlled operational configuration."
      description="This route is reserved for the grouped settings surfaces: bank transfer details, delivery settings, notifications, and admin governance."
      primaryAction={{ href: "/admin", label: "Back To Overview" }}
      summary={[
        {
          label: "Scope",
          value: "Controlled",
          detail: "Only settings with clear operational value should exist here.",
        },
        {
          label: "Examples",
          value: "Bank / Delivery",
          detail: "Bank transfer instructions and delivery defaults are the first-class settings priorities.",
        },
        {
          label: "Governance",
          value: "Audited",
          detail: "Changes here will need explicit audit logging once the data layer is wired.",
        },
      ]}
      sections={[
        {
          title: "Banking",
          description: "Transfer details affect every order and must be edited carefully.",
          items: [
            "Bank account display data",
            "Default active bank account",
            "Customer-facing instruction text",
          ],
        },
        {
          title: "Delivery",
          description: "Operational defaults should be centralized rather than hidden in code.",
          items: [
            "Delivery zones",
            "Assignment defaults",
            "Tracking-related controls if needed later",
          ],
        },
        {
          title: "Admin Governance",
          description: "This route will also hold the admin-only configuration surfaces.",
          items: [
            "Notification behavior",
            "Admin role management",
            "Platform-level site settings",
          ],
        },
      ]}
    />
  );
}
