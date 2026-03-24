import "server-only";

import { buildEmailOtpHtml } from "@/lib/email/auth";
import { buildOrderPlacedPreviewHtml, buildDeliveryUpdatePreviewHtml } from "@/lib/email/orders";
import { buildInviteHtml } from "@/lib/email/users";

export type EmailPreviewTemplate =
  | "order-placed"
  | "delivery-update"
  | "otp"
  | "invite-customer"
  | "invite-admin";

export const EMAIL_PREVIEW_TEMPLATES: Array<{
  key: EmailPreviewTemplate;
  label: string;
  description: string;
}> = [
  {
    key: "order-placed",
    label: "Order placed",
    description: "Customer transfer-ready lifecycle email.",
  },
  {
    key: "delivery-update",
    label: "Delivery update",
    description: "Customer delivery motion lifecycle email.",
  },
  {
    key: "otp",
    label: "Sign-in OTP",
    description: "Auth code email sent during sign-in.",
  },
  {
    key: "invite-customer",
    label: "Customer invite",
    description: "Workspace invite sent to customer account.",
  },
  {
    key: "invite-admin",
    label: "Admin invite",
    description: "Workspace invite sent to admin operator.",
  },
];

export function getEmailPreviewHtml(template: EmailPreviewTemplate) {
  switch (template) {
    case "order-placed":
      return buildOrderPlacedPreviewHtml();
    case "delivery-update":
      return buildDeliveryUpdatePreviewHtml();
    case "otp":
      return buildEmailOtpHtml("839274");
    case "invite-customer":
      return buildInviteHtml({
        fullName: "Amina Musa",
        isAdmin: false,
        href: "https://www.houseofprax.shop/auth/sign-in?returnTo=%2Faccount",
      });
    case "invite-admin":
      return buildInviteHtml({
        fullName: "Praxy Operator",
        isAdmin: true,
        href: "https://www.houseofprax.shop/auth/sign-in?returnTo=%2Fadmin",
      });
    default:
      return buildOrderPlacedPreviewHtml();
  }
}
