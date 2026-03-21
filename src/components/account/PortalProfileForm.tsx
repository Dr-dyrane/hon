"use client";

import { useState, useTransition } from "react";
import type { PortalProfile } from "@/lib/db/types";
import { updateProfileAction } from "@/app/(portal)/account/profile/actions";
import { cn } from "@/lib/utils";

export function PortalProfileForm({ profile }: { profile: PortalProfile }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [marketingOptIn, setMarketingOptIn] = useState(profile.marketingOptIn);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageTone(null);

    const formData = new FormData(event.currentTarget);
    formData.set("marketingOptIn", marketingOptIn ? "true" : "false");

    startTransition(async () => {
      const result = await updateProfileAction(formData);

      if (!result.success) {
        setMessage(result.error || "Unable to save.");
        setMessageTone("error");
        return;
      }

      setMessage("Saved.");
      setMessageTone("success");
    });
  }

  return (
    <form id="account-profile-form" onSubmit={handleSubmit} className="space-y-6 pb-24">
      <section className="rounded-[28px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <InputGroup label="Name" name="fullName" defaultValue={profile.fullName} required />
          <InputGroup label="Phone" name="preferredPhone" defaultValue={profile.preferredPhoneE164} required />
          <InputGroup label="First" name="firstName" defaultValue={profile.firstName} />
          <InputGroup label="Last" name="lastName" defaultValue={profile.lastName} />
          <InputGroup
            label="Email"
            value={profile.email}
            readOnly
            className="md:col-span-2 opacity-60"
          />
        </div>
      </section>

      <section className="rounded-[28px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <button
          type="button"
          onClick={() => setMarketingOptIn((current) => !current)}
          className="flex min-h-[52px] w-full items-center justify-between rounded-[22px] bg-system-fill/42 px-4"
        >
          <div className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              Updates
            </p>
            <p className="mt-1 text-sm text-label">
              {marketingOptIn ? "On" : "Off"}
            </p>
          </div>
          <span
            className={cn(
              "inline-flex min-w-[58px] justify-center rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]",
              marketingOptIn
                ? "bg-accent/10 text-accent"
                : "bg-system-fill/52 text-secondary-label"
            )}
          >
            {marketingOptIn ? "On" : "Off"}
          </span>
        </button>
      </section>

      <div className="sticky bottom-6 z-30">
        <div className="flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/56 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <p
            className={cn(
              "text-xs font-medium",
              messageTone === "success" && "text-accent",
              messageTone === "error" && "text-red-500",
              !messageTone && "text-secondary-label"
            )}
          >
            {message ?? "Delivery phone required."}
          </p>
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "button-primary min-h-[44px] min-w-[132px] px-5 text-[11px] font-semibold uppercase tracking-[0.16em]",
              isPending && "pointer-events-none opacity-50"
            )}
          >
            {isPending ? "Saving" : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}

function InputGroup({
  label,
  className,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {label}
      </label>
      <input
        {...props}
        className="flex min-h-[48px] w-full rounded-[20px] bg-system-fill/42 px-4 text-sm text-label outline-none transition-all placeholder:text-tertiary-label focus:bg-system-fill/58"
      />
    </div>
  );
}
