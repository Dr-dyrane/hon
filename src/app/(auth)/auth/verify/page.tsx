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
      title="Enter the code."
      description={
        <>
          Sent to{" "}
          <span className="font-semibold text-label">
            {maskEmailAddress(challenge.email)}
          </span>
          .
        </>
      }
      footer={
        <Link
          href="/auth/sign-in"
          className="font-medium text-label underline-offset-4 hover:underline"
        >
          Another email
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
