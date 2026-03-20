import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { EmailOtpVerifyForm } from "@/components/auth/EmailOtpVerifyForm";
import { maskEmailAddress } from "@/lib/auth/navigation";
import { getPendingAuthChallenge } from "@/lib/auth/session";
import { serverEnv } from "@/lib/config/server";

export default async function VerifyPage() {
  const challenge = await getPendingAuthChallenge();

  if (!challenge) {
    redirect("/auth/sign-in");
  }

  return (
    <AuthCard
      badge="Verification"
      title="Confirm your sign-in code."
      description={
        <>
          Enter the current six-digit code sent to{" "}
          <span className="font-semibold text-label">
            {maskEmailAddress(challenge.email)}
          </span>
          . This is the same boundary the portal and admin shells will use once live
          email delivery is attached.
        </>
      }
      footer={
        <Link
          href="/auth/sign-in"
          className="font-medium text-label underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      }
    >
      <EmailOtpVerifyForm
        developmentOtpCode={
          serverEnv.isDevelopment ? serverEnv.auth.developmentOtpCode : undefined
        }
      />
    </AuthCard>
  );
}
