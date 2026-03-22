"use client";

import { useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

function buildErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to upload image.";
}

type UploadPayload = {
  ok: boolean;
  error?: string;
  data?: {
    uploadUrl: string;
    storageKey: string;
    publicUrl: string;
    contentType: string;
  };
};

type CommitPayload = {
  ok: boolean;
  error?: string;
  data?: {
    storageKey: string;
    publicUrl: string;
  };
};

export function TaxonomyImageUploader({
  ingredientId,
  value,
  onChange,
}: {
  ingredientId?: string | null;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error" | null>(null);

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];

    if (!file) {
      setMessage("Choose an image first.");
      setTone("error");
      return;
    }

    startTransition(async () => {
      try {
        setMessage(null);
        setTone(null);

        const presignResponse = await fetch(
          "/api/admin/catalog/taxonomy/media/presign",
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ingredientId: ingredientId ?? null,
              fileName: file.name,
              contentType: file.type || "application/octet-stream",
            }),
          }
        );

        const presignPayload = (await presignResponse.json()) as UploadPayload;

        if (
          !presignResponse.ok ||
          !presignPayload.ok ||
          !presignPayload.data
        ) {
          throw new Error(presignPayload.error || "Unable to prepare upload.");
        }

        const uploadResponse = await fetch(presignPayload.data.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": presignPayload.data.contentType,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Unable to upload image.");
        }

        const commitResponse = await fetch(
          "/api/admin/catalog/taxonomy/media/commit",
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ingredientId: ingredientId ?? null,
              storageKey: presignPayload.data.storageKey,
              publicUrl: presignPayload.data.publicUrl,
              fileName: file.name,
              contentType: presignPayload.data.contentType,
            }),
          }
        );

        const commitPayload = (await commitResponse.json()) as CommitPayload;

        if (!commitResponse.ok || !commitPayload.ok || !commitPayload.data) {
          throw new Error(commitPayload.error || "Unable to confirm upload.");
        }

        onChange(commitPayload.data.publicUrl);
        setMessage("Image uploaded.");
        setTone("success");

        if (inputRef.current) {
          inputRef.current.value = "";
        }
      } catch (error) {
        setMessage(buildErrorMessage(error));
        setTone("error");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="min-w-0 rounded-[20px] bg-system-fill/42 px-4 py-3 text-sm text-label file:mr-3 file:rounded-full file:bg-[color:var(--surface)] file:px-3 file:py-2 file:text-[10px] file:font-semibold file:text-label"
        />
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={isUploading}
          className="button-secondary min-h-[48px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] disabled:translate-y-0 disabled:opacity-60"
        >
          {isUploading ? "Uploading" : "Upload"}
        </button>
      </div>

      <div className="rounded-[20px] bg-system-fill/36 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
            Image URL
          </p>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label transition-colors duration-200 hover:text-label"
            >
              Clear
            </button>
          ) : null}
        </div>

        <input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://..."
          className="mt-2 flex min-h-[44px] w-full rounded-[18px] bg-[color:var(--surface)]/88 px-4 text-sm text-label outline-none transition-all placeholder:text-tertiary-label focus:bg-[color:var(--surface)]"
        />

        <p
          className={cn(
            "mt-2 text-xs text-secondary-label",
            tone === "success" && "text-accent",
            tone === "error" && "text-red-500"
          )}
        >
          {message ?? "Upload to S3, then save to persist."}
        </p>
      </div>
    </div>
  );
}
