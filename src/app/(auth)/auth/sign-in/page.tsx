import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { EmailOtpRequestForm } from "@/components/auth/EmailOtpRequestForm";
import { serverEnv } from "@/lib/config/server";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const params = await searchParams;
  const returnTo = Array.isArray(params.returnTo)
    ? params.returnTo[0]
    : params.returnTo;

  return (
    <AuthCard
      badge="Account Access"
      title="Sign in with email OTP."
      description={
        <>
          Launch auth mode is locked to{" "}
          <span className="font-semibold text-label">{serverEnv.auth.mode}</span>. Passwords
          stay out of the first release so guest claiming, checkout continuity, and
          admin onboarding remain simple.
        </>
      }
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Guest checkout remains available throughout the storefront flow.</span>
          <Link
            href="/auth/verify"
            className="font-medium text-label underline-offset-4 hover:underline"
          >
            View verification screen
          </Link>
        </div>
      }
    >
      <EmailOtpRequestForm returnTo={returnTo} />
    </AuthCard>
  );
}
