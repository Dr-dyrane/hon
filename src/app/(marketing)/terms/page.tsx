import type { Metadata } from "next";
import { InfoPageTemplate } from "@/components/sections/InfoPageTemplate";

const LAST_UPDATED = "March 24, 2026";

export const metadata: Metadata = {
  title: "Terms | House of Prax",
  description:
    "House of Prax terms covering orders, payments, delivery, returns, and account use.",
};

export default function TermsPage() {
  return (
    <InfoPageTemplate
      eyebrow="Legal"
      title="Terms of Service"
      summary="These terms govern your use of House of Prax, including checkout, transfer payments, fulfillment, delivery, and account usage."
      lastUpdated={LAST_UPDATED}
      actions={[
        { label: "Need support", href: "/support" },
        { label: "Privacy policy", href: "/privacy", tone: "secondary" },
      ]}
      sections={[
        {
          title: "Orders and pricing",
          items: [
            "Order availability, pricing, and product descriptions can change without prior notice.",
            "Your order is confirmed after checkout submission, but operational review may still be required.",
            "We reserve the right to cancel or limit orders that appear fraudulent, abusive, or operationally invalid.",
          ],
        },
        {
          title: "Payments",
          items: [
            "Checkout supports bank-transfer flow and may require payment proof for review.",
            "Orders can move to pending, under review, confirmed, rejected, expired, or cancelled states based on payment verification.",
            "Incomplete or unmatched payment details may delay or block fulfillment.",
          ],
        },
        {
          title: "Delivery and fulfillment",
          items: [
            "Delivery timing depends on stock readiness, dispatch conditions, and verified address details.",
            "You are responsible for providing accurate contact and delivery information.",
            "Failed delivery attempts may require rescheduling and additional verification.",
          ],
        },
        {
          title: "Returns and support",
          items: [
            "Return and issue handling follows the support policy and may require photo or proof uploads.",
            "Decisions on damaged, incomplete, or wrong-item claims depend on verification outcome.",
            "Support channels and response expectations are listed on the support page.",
          ],
        },
        {
          title: "Account and acceptable use",
          items: [
            "Do not misuse the platform, automate abuse, or interfere with operations.",
            "You are responsible for activity under your account and shared devices.",
            "We may suspend accounts or access where misuse, fraud, or safety risk is detected.",
          ],
        },
        {
          title: "Liability and updates",
          items: [
            "Service is provided as available, with reasonable efforts to maintain continuity.",
            "House of Prax is not liable for indirect losses caused by outages or third-party failures.",
            "These terms may be updated as operations evolve. Material updates are reflected by the last-updated date.",
          ],
        },
      ]}
    />
  );
}
