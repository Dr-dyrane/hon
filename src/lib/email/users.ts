import "server-only";

import { serverEnv } from "@/lib/config/server";
import { sendResendEmail } from "@/lib/email/resend";

function buildInviteLink(isAdmin: boolean) {
  const returnTo = isAdmin ? "/admin" : "/account";
  return `${serverEnv.public.appUrl}/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`;
}

function buildInviteHtml(input: {
  fullName: string | null;
  isAdmin: boolean;
  href: string;
}) {
  const name = input.fullName?.trim() || "there";

  return `
    <div style="background:#f7f4ec;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#161616;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:28px;padding:32px;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#6b7280;font-weight:600;">House of Prax</div>
        <h1 style="margin:16px 0 10px;font-size:32px;line-height:1.05;color:#111827;">Your workspace is ready</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">Hi ${name}. Use your email to enter the House of Prax ${input.isAdmin ? "operations console" : "customer portal"}.</p>
        <div style="border-radius:24px;background:#eef2ef;padding:18px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6b7280;font-weight:600;">How it works</div>
          <div style="margin-top:8px;font-size:15px;line-height:1.7;color:#374151;">Tap below, enter this email address, and House of Prax will send you a six-digit sign-in code.</div>
        </div>
        <div style="margin-top:20px;">
          <a href="${input.href}" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border-radius:999px;background:#0f3d2e;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;">
            Open House of Prax
          </a>
        </div>
      </div>
    </div>
  `;
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
