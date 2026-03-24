import "server-only";

import { serverEnv } from "@/lib/config/server";

type ResendSendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
};

function buildTextSupportFooter() {
  const supportUrl = `${serverEnv.public.appUrl}/support`;
  const helpUrl = `${serverEnv.public.appUrl}/help`;
  const termsUrl = `${serverEnv.public.appUrl}/terms`;
  const privacyUrl = `${serverEnv.public.appUrl}/privacy`;

  return [
    `Need help? Contact support: ${supportUrl}`,
    `Help Center: ${helpUrl}`,
    `Terms of Service: ${termsUrl}`,
    `Privacy Policy: ${privacyUrl}`,
  ].join("\n");
}

function requireResendConfig() {
  if (!serverEnv.email.resendApiKey) {
    throw new Error("Resend is not configured.");
  }

  if (!serverEnv.email.resendFromEmail) {
    throw new Error("Resend sender address is not configured.");
  }
}

export async function sendResendEmail(input: ResendSendEmailInput) {
  requireResendConfig();
  const recipients = Array.isArray(input.to) ? input.to : [input.to];
  const text = `${input.text}\n\n${buildTextSupportFooter()}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.email.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: serverEnv.email.resendFromEmail,
      to: recipients,
      subject: input.subject,
      text,
      html: input.html,
    }),
    cache: "no-store",
  });

  if (response.ok) {
    return;
  }

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; error?: { message?: string } }
    | null;
  const errorMessage =
    payload?.message ??
    payload?.error?.message ??
    `Resend request failed with status ${response.status}.`;

  throw new Error(errorMessage);
}
