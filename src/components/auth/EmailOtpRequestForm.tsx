"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestEmailOtpAction } from "@/lib/auth/actions";
import { INITIAL_AUTH_ACTION_STATE } from "@/lib/auth/action-state";
import { AuthStatusMessage } from "@/components/auth/AuthStatusMessage";

export function EmailOtpRequestForm({
  defaultEmail,
  returnTo,
}: {
  defaultEmail?: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    requestEmailOtpAction,
    INITIAL_AUTH_ACTION_STATE
  );

  useEffect(() => {
    if (state.redirectTo) {
      router.replace(state.redirectTo);
    }
  }, [router, state.redirectTo]);

  return (
    <form action={formAction} className="grid gap-4 rounded-[32px] bg-system-fill/70 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <input type="hidden" name="returnTo" value={returnTo ?? "/account"} />

      <label className="grid gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Email Address
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          defaultValue={defaultEmail}
          placeholder="halodyrane@gmail.com"
          className="w-full rounded-[24px] bg-system-background px-4 py-3 text-sm text-label placeholder:text-secondary-label"
        />
      </label>

      {state.message ? (
        <AuthStatusMessage tone={state.status === "error" ? "error" : "success"}>
          {state.message}
        </AuthStatusMessage>
      ) : null}

      {state.developmentOtpCode ? (
        <AuthStatusMessage tone="info">
          Development code: {state.developmentOtpCode}
        </AuthStatusMessage>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="button-primary min-h-[52px] justify-center text-[11px] font-semibold uppercase tracking-headline disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none"
      >
        {pending ? "Preparing Code" : "Request Sign-In Code"}
      </button>
    </form>
  );
}
