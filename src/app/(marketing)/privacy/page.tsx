import type { Metadata } from "next";
import { InfoPageTemplate } from "@/components/sections/InfoPageTemplate";

const LAST_UPDATED = "March 24, 2026";

export const metadata: Metadata = {
  title: "Privacy | House of Prax",
  description:
    "House of Prax privacy policy describing what we collect, why we collect it, and your controls.",
};

export default function PrivacyPage() {
  return (
    <InfoPageTemplate
      eyebrow="Legal"
      title="Privacy Policy"
      summary="This policy explains how House of Prax collects, uses, stores, and protects personal data across the storefront, portal, checkout, and support flows."
      lastUpdated={LAST_UPDATED}
      actions={[
        { label: "Need support", href: "/support" },
        { label: "Terms", href: "/terms", tone: "secondary" },
      ]}
      sections={[
        {
          title: "Data we collect",
          items: [
            "Identity and contact details such as name, email, and phone number.",
            "Delivery data including addresses, notes, and tracking-related context.",
            "Order, payment, proof-upload, and review activity tied to your account or guest token.",
          ],
        },
        {
          title: "Why we use data",
          items: [
            "To process orders, verify payments, and complete delivery operations.",
            "To provide support, send milestone notifications, and resolve return issues.",
            "To maintain platform security, fraud checks, and audit-level operational records.",
          ],
        },
        {
          title: "Sharing and processors",
          items: [
            "We share only what is required with service providers that support hosting, storage, delivery, and messaging.",
            "We do not sell personal data.",
            "Data can be disclosed where required by law or to prevent abuse and security incidents.",
          ],
        },
        {
          title: "Retention and security",
          items: [
            "Data is retained for operational, accounting, and legal requirements.",
            "Access is limited to authorized roles and monitored through audit controls.",
            "No platform is risk-free, but we apply practical safeguards for confidentiality and integrity.",
          ],
        },
        {
          title: "Your controls",
          items: [
            "You can request profile updates and delivery-detail corrections through support.",
            "You can request deletion where legal and operational constraints allow.",
            "Notification preferences can be adjusted in account settings where available.",
          ],
        },
        {
          title: "Policy updates",
          items: [
            "We may update this policy as systems and compliance requirements evolve.",
            "Major changes are reflected by the last-updated date on this page.",
            "Continued usage after updates means acceptance of the revised policy.",
          ],
        },
      ]}
    />
  );
}
