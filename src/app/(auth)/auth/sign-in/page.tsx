import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { EmailOtpRequestForm } from "@/components/auth/EmailOtpRequestForm";

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
      title="Use your email."
      description="We'll send a six-digit code."
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>Guest checkout stays open.</span>
          <Link
            href="/auth/verify"
            className="font-medium text-label underline-offset-4 hover:underline"
          >
            Have a code?
          </Link>
        </div>
      }
    >
      <EmailOtpRequestForm returnTo={returnTo} />
    </AuthCard>
  );
}
