import type { Metadata } from "next";
import { InfoPageTemplate, type InfoPageAction } from "@/components/sections/InfoPageTemplate";
import { getMarketingSnapshot } from "@/lib/marketing/service";

const LAST_UPDATED = "March 24, 2026";

export const metadata: Metadata = {
  title: "Support | House of Prax",
  description:
    "Contact House of Prax support for order issues, payment review, delivery, and returns.",
};

function createWhatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  if (digits.startsWith("0")) {
    return `https://wa.me/234${digits.slice(1)}`;
  }

  return `https://wa.me/${digits}`;
}

function createInstagramHref(handle: string) {
  const sanitized = handle.replace(/^@/, "").trim();

  if (!sanitized) {
    return null;
  }

  return `https://instagram.com/${sanitized}`;
}

export default async function SupportPage() {
  const snapshot = await getMarketingSnapshot();
  const actions: InfoPageAction[] = [];
  const supportChannels: string[] = [];

  for (const rawPhone of snapshot.brand.contact.whatsapp) {
    const whatsappHref = createWhatsAppHref(rawPhone);

    if (!whatsappHref) {
      continue;
    }

    actions.push({
      label: `WhatsApp ${rawPhone}`,
      href: whatsappHref,
      external: true,
    });
    supportChannels.push(`WhatsApp: ${rawPhone}`);
  }

  const instagramHref = createInstagramHref(snapshot.brand.contact.instagram);
  if (instagramHref) {
    actions.push({
      label: `Instagram @${snapshot.brand.contact.instagram.replace(/^@/, "")}`,
      href: instagramHref,
      tone: "secondary",
      external: true,
    });
    supportChannels.push(`Instagram: @${snapshot.brand.contact.instagram.replace(/^@/, "")}`);
  }

  return (
    <InfoPageTemplate
      eyebrow="Support"
      title="Help and Support"
      summary="Reach House of Prax support for payment review delays, delivery issues, order corrections, returns, or account access problems."
      lastUpdated={LAST_UPDATED}
      actions={actions.length > 0 ? actions : [{ label: "Help center", href: "/help" }]}
      sections={[
        {
          title: "What to include",
          items: [
            "Order number and checkout email.",
            "Clear summary of the issue and the outcome you need.",
            "Proof screenshots or receipts when payment or delivery is involved.",
          ],
        },
        {
          title: "Priority cases",
          items: [
            "Payment marked submitted but not moving to confirmed.",
            "Delivery state stalled or incorrect.",
            "Wrong, damaged, or missing items.",
            "Unable to access your order timeline.",
          ],
        },
        {
          title: "Response rhythm",
          items: [
            "Critical fulfillment cases are handled first.",
            "Non-urgent requests are handled in normal queue order.",
            "Follow-up is easier when all context is provided in one thread.",
          ],
        },
        {
          title: "Support channels",
          items:
            supportChannels.length > 0
              ? supportChannels
              : ["No public channel configured yet. Use the help center and account notifications."],
        },
        {
          title: "Self-service first",
          items: [
            "Check order detail status and timeline before opening a ticket.",
            "Use payment proof upload where the order requests it.",
            "Use account profile and address screens for contact corrections.",
          ],
        },
        {
          title: "Policy links",
          items: [
            "Support follows the current Terms of Service and Privacy Policy.",
            "Legal pages are available at /terms and /privacy.",
            "Operational policy updates are reflected by each page last-updated date.",
          ],
        },
      ]}
    />
  );
}
