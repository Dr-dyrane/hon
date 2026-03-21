"use client";

import { useState, useTransition } from "react";
import type { PortalAddress } from "@/lib/db/types";
import {
  deleteAddressAction,
  saveAddressAction,
  setDefaultAddressAction,
} from "@/app/(portal)/account/addresses/actions";
import { cn } from "@/lib/utils";

const emptyDraft = {
  addressId: "",
  label: "",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  postalCode: "",
  deliveryNotes: "",
  latitude: "",
  longitude: "",
  isDefault: false,
};

export function AddressBook({ addresses }: { addresses: PortalAddress[] }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [draft, setDraft] = useState(() =>
    addresses[0]
      ? {
          addressId: "",
          label: addresses[0].label,
          recipientName: addresses[0].recipientName,
          phone: addresses[0].phoneE164,
          line1: addresses[0].line1,
          line2: addresses[0].line2 ?? "",
          landmark: addresses[0].landmark ?? "",
          city: addresses[0].city,
          state: addresses[0].state,
          postalCode: addresses[0].postalCode ?? "",
          deliveryNotes: addresses[0].deliveryNotes ?? "",
          latitude: addresses[0].latitude?.toString() ?? "",
          longitude: addresses[0].longitude?.toString() ?? "",
          isDefault: false,
        }
      : emptyDraft
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  function loadDraft(address?: PortalAddress) {
    if (!address) {
      setEditingId(null);
      setDraft(emptyDraft);
      return;
    }

    setEditingId(address.addressId);
    setDraft({
      addressId: address.addressId,
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phoneE164,
      line1: address.line1,
      line2: address.line2 ?? "",
      landmark: address.landmark ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode ?? "",
      deliveryNotes: address.deliveryNotes ?? "",
      latitude: address.latitude?.toString() ?? "",
      longitude: address.longitude?.toString() ?? "",
      isDefault: address.isDefault,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageTone(null);

    const formData = new FormData(event.currentTarget);
    formData.set("addressId", editingId ?? "");
    formData.set("isDefault", draft.isDefault ? "true" : "false");

    startTransition(async () => {
      const result = await saveAddressAction(formData);

      if (!result.success) {
        setMessage(result.error || "Unable to save.");
        setMessageTone("error");
        return;
      }

      setMessage(editingId ? "Updated." : "Added.");
      setMessageTone("success");
      setEditingId(null);
      setDraft(emptyDraft);
    });
  }

  function runMutation(
    action: () => Promise<{ success: boolean; error?: string }>,
    successMessage: string
  ) {
    setMessage(null);
    setMessageTone(null);

    startTransition(async () => {
      const result = await action();

      if (!result.success) {
        setMessage(result.error || "Unable to update.");
        setMessageTone("error");
        return;
      }

      setMessage(successMessage);
      setMessageTone("success");
      if (editingId) {
        setEditingId(null);
        setDraft(emptyDraft);
      }
    });
  }

  return (
    <div className="space-y-6 pb-24">
      <form
        id="account-address-form"
        onSubmit={handleSubmit}
        className="rounded-[28px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-label">
            {editingId ? "Edit" : "New"}
          </h2>
          {editingId ? (
            <button
              type="button"
              onClick={() => loadDraft()}
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label"
            >
              Clear
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <InputGroup label="Label" name="label" value={draft.label} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))} required />
          <InputGroup label="Recipient" name="recipientName" value={draft.recipientName} onChange={(event) => setDraft((current) => ({ ...current, recipientName: event.target.value }))} required />
          <InputGroup label="Phone" name="phone" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} required />
          <InputGroup label="Line 1" name="line1" value={draft.line1} onChange={(event) => setDraft((current) => ({ ...current, line1: event.target.value }))} required />
          <InputGroup label="Line 2" name="line2" value={draft.line2} onChange={(event) => setDraft((current) => ({ ...current, line2: event.target.value }))} />
          <InputGroup label="Landmark" name="landmark" value={draft.landmark} onChange={(event) => setDraft((current) => ({ ...current, landmark: event.target.value }))} />
          <InputGroup label="City" name="city" value={draft.city} onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))} required />
          <InputGroup label="State" name="state" value={draft.state} onChange={(event) => setDraft((current) => ({ ...current, state: event.target.value }))} required />
          <InputGroup label="Postal" name="postalCode" value={draft.postalCode} onChange={(event) => setDraft((current) => ({ ...current, postalCode: event.target.value }))} />
          <InputGroup label="Latitude" name="latitude" value={draft.latitude} onChange={(event) => setDraft((current) => ({ ...current, latitude: event.target.value }))} />
          <InputGroup label="Longitude" name="longitude" value={draft.longitude} onChange={(event) => setDraft((current) => ({ ...current, longitude: event.target.value }))} />
          <InputGroup label="Notes" name="deliveryNotes" value={draft.deliveryNotes} onChange={(event) => setDraft((current) => ({ ...current, deliveryNotes: event.target.value }))} className="md:col-span-2" />
        </div>

        <button
          type="button"
          onClick={() => setDraft((current) => ({ ...current, isDefault: !current.isDefault }))}
          className="mt-4 flex min-h-[48px] w-full items-center justify-between rounded-[20px] bg-system-fill/42 px-4"
        >
          <div className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              Default
            </p>
            <p className="mt-1 text-sm text-label">{draft.isDefault ? "Yes" : "No"}</p>
          </div>
          <span
            className={cn(
              "inline-flex min-w-[58px] justify-center rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]",
              draft.isDefault
                ? "bg-accent/10 text-accent"
                : "bg-system-fill/52 text-secondary-label"
            )}
          >
            {draft.isDefault ? "On" : "Off"}
          </span>
        </button>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "button-primary min-h-[44px] min-w-[132px] px-5 text-[11px] font-semibold uppercase tracking-[0.16em]",
              isPending && "pointer-events-none opacity-50"
            )}
          >
            {isPending ? "Saving" : editingId ? "Update" : "Add"}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {addresses.length === 0 ? (
          <div className="rounded-[28px] bg-system-background/86 px-5 py-6 text-sm text-secondary-label shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            No addresses yet.
          </div>
        ) : (
          addresses.map((address) => (
            <article
              key={address.addressId}
              className="rounded-[28px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-3 min-[920px]:flex-row min-[920px]:items-start min-[920px]:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold tracking-tight text-label">
                      {address.label}
                    </h2>
                    {address.isDefault ? (
                      <span className="rounded-full bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                        default
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-secondary-label">
                    <p className="text-label">{address.recipientName}</p>
                    <p>{address.phoneE164}</p>
                    <p>{address.line1}</p>
                    {address.line2 ? <p>{address.line2}</p> : null}
                    <p>{[address.city, address.state].filter(Boolean).join(", ")}</p>
                    {address.landmark ? <p>{address.landmark}</p> : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {!address.isDefault ? (
                    <button
                      type="button"
                      onClick={() =>
                        runMutation(
                          () => setDefaultAddressAction(address.addressId),
                          "Default updated."
                        )
                      }
                      className="flex min-h-[40px] items-center rounded-[18px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label"
                    >
                      Default
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => loadDraft(address)}
                    className="flex min-h-[40px] items-center rounded-[18px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      runMutation(
                        () => deleteAddressAction(address.addressId),
                        "Removed."
                      )
                    }
                    className="flex min-h-[40px] items-center rounded-[18px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-secondary-label"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

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
            {message ?? "One default address."}
          </p>
          <button
            type="button"
            onClick={() => loadDraft()}
            className="flex min-h-[40px] items-center rounded-[18px] bg-system-background px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label"
          >
            New
          </button>
        </div>
      </div>
    </div>
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
