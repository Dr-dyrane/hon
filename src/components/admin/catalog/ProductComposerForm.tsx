"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AdminCatalogCategory } from "@/lib/db/types";
import { createProductAction } from "@/app/(admin)/admin/catalog/products/[productId]/actions";
import { cn } from "@/lib/utils";

export function ProductComposerForm({
  categories,
}: {
  categories: AdminCatalogCategory[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success" | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageTone(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createProductAction(formData);

      if (!result.success) {
        setMessage(result.error || "Unable to create product.");
        setMessageTone("error");
        return;
      }

      setMessage("Draft created.");
      setMessageTone("success");

      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  }

  return (
    <form id="admin-product-create-form" onSubmit={handleSubmit} className="space-y-6 pb-20">
      <section className="glass-morphism rounded-[28px] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <InputGroup
            label="Product"
            name="productName"
            required
            placeholder="Natural Energy"
          />
          <InputGroup
            label="Marketing"
            name="marketingName"
            placeholder="Natural Energy"
          />
          <SelectGroup
            label="Category"
            name="categoryId"
            defaultValue=""
            options={[
              { label: "Unsorted", value: "" },
              ...categories.map((category) => ({
                label: category.categoryName,
                value: category.categoryId,
              })),
            ]}
          />
          <InputGroup
            label="Variant"
            name="variantName"
            placeholder="Default"
          />
          <InputGroup
            label="Price"
            name="priceNgn"
            type="number"
            min={0}
            required
            placeholder="25000"
          />
        </div>
      </section>

      <div className="sticky bottom-6 z-30">
        <div className="flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/56 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <p
            className={cn(
              "text-xs font-medium",
              messageTone === "error" && "text-red-500",
              messageTone === "success" && "text-accent",
              !messageTone && "text-secondary-label"
            )}
          >
            {message ?? "Draft first."}
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="button-primary min-h-[44px] min-w-[132px] px-5 text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            {isPending ? "Starting" : "Create"}
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

function SelectGroup({
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
