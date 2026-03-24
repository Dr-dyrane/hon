import "server-only";

import { buildEditorialEmail } from "@/lib/email/brand";
import { sendResendEmail } from "@/lib/email/resend";

export function buildEmailOtpHtml(code: string) {
  return buildEditorialEmail({
    eyebrow: "Verification",
    title: "Confirm your access",
    subtitle: "Use the code below to continue.",
    highlight: code,
    action: "This code expires shortly.",
    footnote: "If you did not request this, you can ignore this email.",
  });
}

export async function sendEmailOtp(input: { email: string; code: string }) {
  await sendResendEmail({
    to: input.email,
    subject: "Your House of Prax sign-in code",
    text: `Your House of Prax sign-in code is ${input.code}.`,
    html: buildEmailOtpHtml(input.code),
  });
}
