import "server-only";

import { buildEmailBrandLockup } from "@/lib/email/brand";
import { sendResendEmail } from "@/lib/email/resend";

function buildEmailOtpHtml(code: string) {
  return `
    <div style="background:#f7f4ec;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#161616;">
      <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:28px;padding:32px;box-shadow:0 18px 50px rgba(15,23,42,0.08);">
        ${buildEmailBrandLockup()}
        <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#6b7280;font-weight:600;">House of Prax</div>
        <h1 style="margin:16px 0 10px;font-size:32px;line-height:1.05;color:#111827;">Your sign-in code</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">Use this code to continue into the House of Prax portal.</p>
        <div style="display:inline-block;border-radius:24px;background:#eef2ef;padding:16px 22px;font-size:32px;letter-spacing:0.28em;font-weight:700;color:#0f3d2e;">${code}</div>
        <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">This code expires soon. If you did not request it, you can ignore this email.</p>
      </div>
    </div>
  `;
}

export async function sendEmailOtp(input: { email: string; code: string }) {
  await sendResendEmail({
    to: input.email,
    subject: "Your House of Prax sign-in code",
    text: `Your House of Prax sign-in code is ${input.code}.`,
    html: buildEmailOtpHtml(input.code),
  });
}
