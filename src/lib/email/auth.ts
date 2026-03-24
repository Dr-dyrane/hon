import "server-only";

import { serverEnv } from "@/lib/config/server";
import { buildEditorialEmail } from "@/lib/email/brand";
import { sendResendEmail } from "@/lib/email/resend";

export function buildEmailOtpHtml(code: string) {
  const termsUrl = `${serverEnv.public.appUrl}/terms`;
  const privacyUrl = `${serverEnv.public.appUrl}/privacy`;

  return buildEditorialEmail({
    eyebrow: "Verification",
    title: "Confirm your access",
    subtitle: "Use the code below to continue.",
    highlight: code,
    action: "This code expires shortly.",
    footnote: `By continuing, you agree to the <a href="${termsUrl}">Terms of Service</a> and <a href="${privacyUrl}">Privacy Policy</a>.<br />If you did not request this, you can ignore this email.`,
  });
}

export async function sendEmailOtp(input: { email: string; code: string }) {
  const termsUrl = `${serverEnv.public.appUrl}/terms`;

  await sendResendEmail({
    to: input.email,
    subject: "Your House of Prax sign-in code",
    text: `Your House of Prax sign-in code is ${input.code}. By continuing, you agree to the Terms of Service: ${termsUrl}`,
    html: buildEmailOtpHtml(input.code),
  });
}
