"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatNgn } from "@/lib/commerce";
import type {
  OrderReturnCaseRow,
  OrderReturnEventRow,
  OrderReturnProofRow,
} from "@/lib/db/types";
import { OrderReturnProofUploadCard } from "@/components/orders/OrderReturnProofUploadCard";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Try again.";
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatusLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function OrderReturnRequestCard({
  orderId,
  accessToken,
  orderStatus,
  returnCase,
  returnEvents,
  proofs,
}: {
  orderId: string;
  accessToken?: string;
  orderStatus: string;
  returnCase: OrderReturnCaseRow | null;
  returnEvents: OrderReturnEventRow[];
  proofs: OrderReturnProofRow[];
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [refundBankName, setRefundBankName] = useState("");
  const [refundAccountName, setRefundAccountName] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canRequestReturn = orderStatus === "delivered" && !returnCase;

  if (!canRequestReturn && !returnCase) {
    return null;
  }

  async function handleSubmit() {
    startTransition(async () => {
      try {
        setMessage(null);

        const response = await fetch("/api/order-returns", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            accessToken,
            reason,
            details,
            refundBankName,
            refundAccountName,
            refundAccountNumber,
          }),
        });

        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
        };

        if (!response.ok || !payload.ok) {
          throw new Error(payload.error || "Try again.");
        }

        setReason("");
        setDetails("");
        setRefundBankName("");
        setRefundAccountName("");
        setRefundAccountNumber("");
        setMessage("Sent.");
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  if (returnCase) {
    return (
      <div className="space-y-3">
        <div className="rounded-[22px] bg-system-fill/36 px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-label">
              {formatStatusLabel(returnCase.status)}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              {formatTimestamp(returnCase.createdAt)}
            </div>
          </div>
          <div className="mt-2 text-sm text-secondary-label">{returnCase.reason}</div>
          {returnCase.details ? (
            <div className="mt-2 text-sm text-secondary-label">{returnCase.details}</div>
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <MetaPill
            label="Requested"
            value={formatNgn(returnCase.requestedRefundAmountNgn)}
          />
          <MetaPill
            label="Refund"
            value={
              returnCase.approvedRefundAmountNgn !== null
                ? formatNgn(returnCase.approvedRefundAmountNgn)
                : "Pending"
            }
          />
        </div>

        {returnCase.refundBankName || returnCase.refundAccountName || returnCase.refundAccountNumber ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <MetaPill label="Bank" value={returnCase.refundBankName ?? "Pending"} />
            <MetaPill label="Name" value={returnCase.refundAccountName ?? "Pending"} />
            <MetaPill label="Number" value={returnCase.refundAccountNumber ?? "Pending"} />
          </div>
        ) : null}

        {returnCase.refundReference ? (
          <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
            <span className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              Reference
            </span>
            <div className="mt-1 text-label">{returnCase.refundReference}</div>
          </div>
        ) : null}

        {returnCase.resolutionNote ? (
          <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
            {returnCase.resolutionNote}
          </div>
        ) : null}

        <OrderReturnProofUploadCard
          orderId={orderId}
          returnCaseId={returnCase.returnCaseId}
          accessToken={accessToken}
          disabled={["rejected", "refunded"].includes(returnCase.status)}
        />

        {proofs.length > 0 ? (
          <div className="grid gap-2 text-sm text-secondary-label">
            {proofs.map((proof) => (
              <a
                key={proof.proofId}
                href={proof.publicUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-4 rounded-[22px] bg-system-fill/36 px-4 py-3 transition-colors duration-300 hover:text-label"
              >
                <span>{proof.mimeType}</span>
                <span>{formatTimestamp(proof.createdAt)}</span>
              </a>
            ))}
          </div>
        ) : null}

        {returnEvents.length > 0 ? (
          <div className="grid gap-2 text-sm text-secondary-label">
            {returnEvents.map((event) => (
              <div
                key={event.eventId}
                className="flex items-center justify-between gap-4 rounded-[22px] bg-system-fill/36 px-4 py-3"
              >
                <span className="text-label">{formatStatusLabel(event.action)}</span>
                <span>{formatTimestamp(event.createdAt)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[22px] bg-system-fill/36 px-4 py-3 text-sm text-secondary-label">
        Ask for a return.
      </div>

      <input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason"
        className="min-h-[44px] w-full rounded-[22px] bg-system-fill/52 px-4 text-sm text-label placeholder:text-tertiary-label focus:outline-none"
      />

      <textarea
        value={details}
        onChange={(event) => setDetails(event.target.value)}
        placeholder="Add details"
        rows={4}
        className="w-full resize-none rounded-[24px] bg-system-fill/52 px-4 py-3 text-sm text-label placeholder:text-tertiary-label focus:outline-none"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <input
          value={refundBankName}
          onChange={(event) => setRefundBankName(event.target.value)}
          placeholder="Refund bank"
          className="min-h-[44px] w-full rounded-[22px] bg-system-fill/52 px-4 text-sm text-label placeholder:text-tertiary-label focus:outline-none"
        />
        <input
          value={refundAccountName}
          onChange={(event) => setRefundAccountName(event.target.value)}
          placeholder="Account name"
          className="min-h-[44px] w-full rounded-[22px] bg-system-fill/52 px-4 text-sm text-label placeholder:text-tertiary-label focus:outline-none"
        />
        <input
          value={refundAccountNumber}
          onChange={(event) => setRefundAccountNumber(event.target.value)}
          placeholder="Account number"
          className="min-h-[44px] w-full rounded-[22px] bg-system-fill/52 px-4 text-sm text-label placeholder:text-tertiary-label focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isPending}
          className="button-secondary min-h-[44px] text-xs font-semibold uppercase tracking-headline"
        >
          {isPending ? "Sending" : "Send"}
        </button>
        {message ? <p className="text-xs text-secondary-label">{message}</p> : null}
      </div>
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-system-fill/36 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-label">{value}</div>
    </div>
  );
}
