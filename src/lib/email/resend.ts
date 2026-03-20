import "server-only";

import { serverEnv } from "@/lib/config/server";

type ResendSendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.email.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: serverEnv.email.resendFromEmail,
      to: [input.to],
      subject: input.subject,
      text: input.text,
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
