"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminUserSummary } from "@/lib/db/types";
import {
  createAdminUserAction,
  deleteAdminUserAction,
  updateAdminUserAction,
} from "@/app/(admin)/admin/users/actions";
import { cn } from "@/lib/utils";

export function AdminUserManager({ users }: { users: AdminUserSummary[] }) {
  return (
    <div className="grid gap-6 2xl:grid-cols-[0.78fr_1.22fr]">
      <section>
        <ComposerCard />
      </section>
      <section className="space-y-3">
        {users.map((user) => (
          <UserCard key={user.userId} user={user} />
        ))}
      </section>
    </div>
  );
}

function ComposerCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
          const result = await createAdminUserAction(formData);

          if (!result.success) {
            setMessage(result.error || "Unable to create.");
            return;
          }

          form.reset();
          setMessage("Created.");
          router.refresh();
        });
      }}
      className="glass-morphism rounded-[32px] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        New User
      </div>
      <div className="mt-4 grid gap-3">
        <Field label="Email" name="email" type="email" required />
        <Field label="Name" name="fullName" />
        <Field label="Phone" name="phone" />
        <SelectField
          label="Status"
          name="status"
          defaultValue="invited"
          options={[
            { label: "Invited", value: "invited" },
            { label: "Active", value: "active" },
            { label: "Suspended", value: "suspended" },
          ]}
        />
        <SelectField
          label="Access"
          name="isAdmin"
          defaultValue="false"
          options={[
            { label: "Customer", value: "false" },
            { label: "Admin", value: "true" },
          ]}
        />
      </div>
      <ActionRow message={message} pending={isPending} submitLabel="Create" />
    </form>
  );
}

function UserCard({ user }: { user: AdminUserSummary }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        formData.set("userId", user.userId);

        startTransition(async () => {
          const result = await updateAdminUserAction(formData);

          if (!result.success) {
            setMessage(result.error || "Unable to save.");
            return;
          }

          setMessage("Saved.");
          router.refresh();
        });
      }}
      className="glass-morphism rounded-[32px] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
    >
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_160px_140px]">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email" value={user.email} readOnly className="opacity-70" />
          <Field label="Name" name="fullName" defaultValue={user.fullName ?? ""} />
          <Field label="Phone" name="phone" defaultValue={user.phone ?? ""} />
          <MetricPill
            label="Last seen"
            value={user.lastSignedInAt ? formatTimestamp(user.lastSignedInAt) : "Never"}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <SelectField
            label="Status"
            name="status"
            defaultValue={user.status}
            options={[
              { label: "Active", value: "active" },
              { label: "Invited", value: "invited" },
              { label: "Suspended", value: "suspended" },
            ]}
          />
          <SelectField
            label="Access"
            name="isAdmin"
            defaultValue={user.isAdmin ? "true" : "false"}
            options={[
              { label: "Customer", value: "false" },
              { label: "Admin", value: "true" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricPill label="Orders" value={`${user.orderCount}`} />
          <MetricPill label="Places" value={`${user.addressCount}`} />
        </div>
        <div className="flex items-end">
          <div className="w-full rounded-[24px] bg-system-fill/42 px-4 py-3">
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              Created
            </div>
            <div className="mt-1 text-sm font-medium text-label">
              {formatTimestamp(user.createdAt)}
            </div>
          </div>
        </div>
      </div>
      <ActionRow
        message={
          message ??
          (user.orderCount > 0
            ? "Delete blocked while orders exist."
            : "Ready.")
        }
        pending={isPending}
        submitLabel="Save"
        dangerLabel="Delete"
        onDanger={() =>
          startTransition(async () => {
            setMessage(null);
            const result = await deleteAdminUserAction(user.userId);

            if (!result.success) {
              setMessage(result.error || "Unable to delete.");
              return;
            }

            router.refresh();
          })
        }
      />
    </form>
  );
}

function ActionRow({
  message,
  pending,
  submitLabel,
  dangerLabel,
  onDanger,
}: {
  message: string | null;
  pending: boolean;
  submitLabel: string;
  dangerLabel?: string;
  onDanger?: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[24px] bg-system-fill/42 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="rounded-[18px] bg-system-fill/32 px-3 py-2 text-xs font-medium text-secondary-label">
        {message ?? "Ready."}
      </p>
      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
        {dangerLabel && onDanger ? (
          <button
            type="button"
            onClick={onDanger}
            disabled={pending}
            className={cn(
              "min-h-[40px] w-full rounded-full bg-system-fill/56 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-500 transition-colors duration-200 hover:bg-system-fill/76",
              pending && "pointer-events-none opacity-50"
            )}
          >
            {dangerLabel}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "button-primary min-h-[40px] w-full min-w-[112px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em]",
            pending && "pointer-events-none opacity-50"
          )}
        >
          {pending ? "Saving" : submitLabel}
        </button>
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-system-fill/42 px-4 py-3">
      <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-label">{value}</div>
    </div>
  );
}

function Field({
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

function SelectField({
  label,
  options,
  className,
  ...props
}: {
  label: string;
  options: { label: string; value: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {label}
      </label>
      <select
        {...props}
        className="flex min-h-[48px] w-full appearance-none rounded-[20px] bg-system-fill/42 px-4 text-sm text-label outline-none transition-all focus:bg-system-fill/58"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
