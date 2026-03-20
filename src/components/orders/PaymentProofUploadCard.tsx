"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Upload failed.";
}

export function PaymentProofUploadCard({
  orderId,
  paymentId,
  accessToken,
}: {
  orderId: string;
  paymentId: string | null;
  accessToken?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!paymentId) {
    return null;
  }

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];

    if (!file) {
      setMessage("Pick a file.");
      return;
    }

    startTransition(async () => {
      try {
        setMessage(null);

        const presignResponse = await fetch("/api/payment-proofs/presign", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            paymentId,
            accessToken,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
          }),
        });

        const presignPayload = (await presignResponse.json()) as {
          ok: boolean;
          error?: string;
          data?: {
            uploadUrl: string;
            storageKey: string;
            publicUrl: string;
            contentType: string;
          };
        };

        if (!presignResponse.ok || !presignPayload.ok || !presignPayload.data) {
          throw new Error(presignPayload.error || "Upload failed.");
        }

        const uploadResponse = await fetch(presignPayload.data.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": presignPayload.data.contentType,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Upload failed.");
        }

        const commitResponse = await fetch("/api/payment-proofs/commit", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            paymentId,
            accessToken,
            storageKey: presignPayload.data.storageKey,
            publicUrl: presignPayload.data.publicUrl,
            mimeType: presignPayload.data.contentType,
          }),
        });

        const commitPayload = (await commitResponse.json()) as {
          ok: boolean;
          error?: string;
        };

        if (!commitResponse.ok || !commitPayload.ok) {
          throw new Error(commitPayload.error || "Upload failed.");
        }

        if (inputRef.current) {
          inputRef.current.value = "";
        }

        setMessage("Added.");
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="min-w-0 flex-1 rounded-[24px] bg-system-fill/70 px-3 py-3 text-xs text-label file:mr-3 file:rounded-full file:bg-system-background file:px-3 file:py-2 file:text-[10px] file:font-semibold file:text-label"
      />
      <button
        type="button"
        onClick={() => void handleUpload()}
        disabled={isPending}
        className="button-primary min-h-[44px] shrink-0 text-xs font-semibold uppercase tracking-headline disabled:translate-y-0 disabled:shadow-none md:px-5"
      >
        {isPending ? "Sending" : "Add proof"}
      </button>
      {message ? (
        <p className="text-xs text-secondary-label md:min-w-[72px] md:text-right">{message}</p>
      ) : null}
    </div>
  );
}
