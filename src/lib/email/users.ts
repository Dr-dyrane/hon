import "server-only";

import { serverEnv } from "@/lib/config/server";
import { buildEditorialEmail } from "@/lib/email/brand";
import { sendResendEmail } from "@/lib/email/resend";

function buildInviteLink(isAdmin: boolean) {
  const returnTo = isAdmin ? "/admin" : "/account";
  return `${serverEnv.public.appUrl}/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`;
}

export function buildInviteHtml(input: {
  fullName: string | null;
  isAdmin: boolean;
  href: string;
}) {
  const name = input.fullName?.trim() || "there";

  return buildEditorialEmail({
    eyebrow: input.isAdmin ? "Operations" : "Account",
    title: "Access is ready",
    subtitle: `Hi ${name}. Your ${input.isAdmin ? "operations console" : "customer portal"} access is now live.`,
    action: "Open the link, enter this email, then use the six-digit sign-in code.",
    cta: {
      label: "Enter House of Prax",
      url: input.href,
    },
    footnote: "Use the same email address you were invited with.",
  });
}

export async function sendWorkspaceInviteEmail(input: {
  email: string;
  fullName: string | null;
  isAdmin: boolean;
}) {
  const href = buildInviteLink(input.isAdmin);

  await sendResendEmail({
    to: input.email,
    subject: input.isAdmin
      ? "You have House of Prax admin access"
      : "Your House of Prax account is ready",
    text: `Use your email to sign in to House of Prax: ${href}`,
    html: buildInviteHtml({
      fullName: input.fullName,
      isAdmin: input.isAdmin,
      href,
    }),
  });
}
