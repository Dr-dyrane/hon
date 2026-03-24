import type { Metadata } from "next";
import { InfoPageTemplate } from "@/components/sections/InfoPageTemplate";

const LAST_UPDATED = "March 24, 2026";

export const metadata: Metadata = {
  title: "Help | House of Prax",
  description:
    "House of Prax help center for checkout, payment proof, delivery tracking, and returns.",
};

export default function HelpPage() {
  return (
    <InfoPageTemplate
      eyebrow="Help"
      title="Help Center"
      summary="Quick answers for ordering, payment confirmation, tracking, and post-delivery support."
      lastUpdated={LAST_UPDATED}
      actions={[
        { label: "Contact support", href: "/support" },
        { label: "Open account", href: "/account", tone: "secondary" },
      ]}
      sections={[
        {
          title: "Before you order",
          items: [
            "Review product details and availability before checkout.",
            "Use a reachable phone number and accurate delivery address.",
            "Guest checkout is supported, and account claim can happen later.",
          ],
        },
        {
          title: "After checkout",
          items: [
            "You receive an order record and transfer instructions.",
            "Upload payment proof when available to move review faster.",
            "Order status updates in your order detail screen and notifications.",
          ],
        },
        {
          title: "Payment review",
          items: [
            "Submitted payments can move through under-review, confirmed, rejected, or expired states.",
            "If details do not match, add corrected transfer info or updated proof.",
            "Support can help verify stuck or unclear payment status.",
          ],
        },
        {
          title: "Delivery tracking",
          items: [
            "Tracking becomes active when dispatch starts.",
            "Live status and ETA can vary based on route and network conditions.",
            "If your order appears stalled, contact support with your order number.",
          ],
        },
        {
          title: "Returns and issues",
          items: [
            "For wrong, damaged, or incomplete items, submit a return/issue request with proof.",
            "Review outcome depends on verification and order history.",
            "Use support for urgent resolution and next-step instructions.",
          ],
        },
        {
          title: "Account and notifications",
          items: [
            "Manage profile, addresses, and preferences from your account routes.",
            "If you cannot access an order, sign in with the same email or use guest route links.",
            "Keep contact details current to avoid delivery and support delays.",
          ],
        },
      ]}
    />
  );
}
