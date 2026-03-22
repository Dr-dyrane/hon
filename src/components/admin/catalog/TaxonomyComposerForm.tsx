"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProgressiveFormSection } from "@/components/forms/ProgressiveFormSection";
import { useUI } from "@/components/providers/UIProvider";
import { TaxonomyImageUploader } from "@/components/admin/catalog/TaxonomyImageUploader";
import { createTaxonomyEntryAction } from "@/app/(admin)/admin/catalog/taxonomy/actions";
import { cn } from "@/lib/utils";

export function TaxonomyComposerForm() {
  const router = useRouter();
  const { hasActiveOverlay } = useUI();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success" | null>(
    null
  );
  const [taxonomyType, setTaxonomyType] = useState<"category" | "ingredient">(
    "category"
  );
  const [imagePath, setImagePath] = useState("");
  const [draft, setDraft] = useState({
    categoryName: "",
    ingredientName: "",
    detail: "",
    sortOrder: "0",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageTone(null);

    const formData = new FormData(event.currentTarget);
    formData.set("taxonomyType", taxonomyType);
    formData.set("imagePath", imagePath);

    if (taxonomyType === "category") {
      formData.delete("detail");
      formData.delete("benefit");
      formData.delete("aliases");
      formData.delete("ingredientName");
    }

    startTransition(async () => {
      const result = await createTaxonomyEntryAction(formData);

      if (!result.success) {
        setMessage(result.error || "Unable to create taxonomy.");
        setMessageTone("error");
        return;
      }

      setMessage("Created.");
      setMessageTone("success");

      if (result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form
      id="admin-taxonomy-create-form"
      onSubmit={handleSubmit}
      className="space-y-6 pb-24"
    >
      <div className="flex flex-wrap gap-2">
        <TypePill
          label="Category"
          active={taxonomyType === "category"}
          onClick={() => setTaxonomyType("category")}
        />
        <TypePill
          label="Ingredient"
          active={taxonomyType === "ingredient"}
          onClick={() => setTaxonomyType("ingredient")}
        />
      </div>

      <ProgressiveFormSection
        step="01"
        title="Identity"
        summary={
          taxonomyType === "category"
            ? draft.categoryName || "New category"
            : draft.ingredientName || "New ingredient"
        }
        defaultOpen
        className="glass-morphism"
        bodyClassName="pt-0"
      >
        <input type="hidden" name="taxonomyType" value={taxonomyType} />
        <div className="grid gap-4 md:grid-cols-2">
          {taxonomyType === "category" ? (
            <InputGroup
              label="Category"
              name="categoryName"
              required
              value={draft.categoryName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  categoryName: event.target.value,
                }))
              }
            />
          ) : (
            <InputGroup
              label="Ingredient"
              name="ingredientName"
              required
              value={draft.ingredientName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  ingredientName: event.target.value,
                }))
              }
            />
          )}

          <InputGroup
            label="Sort"
            name="sortOrder"
            type="number"
            value={draft.sortOrder}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                sortOrder: event.target.value,
              }))
            }
            required
          />
        </div>

        {taxonomyType === "category" ? (
          <div className="mt-4">
            <InputGroup
              label="Image URL"
              name="imagePath"
              value={imagePath}
              onChange={(event) => setImagePath(event.target.value)}
              placeholder="/images/products/protein_chocolate.png"
            />
          </div>
        ) : null}
      </ProgressiveFormSection>

      {taxonomyType === "ingredient" ? (
        <ProgressiveFormSection
          step="02"
          title="Profile"
          summary={draft.detail ? "Ready" : "Describe ingredient"}
          defaultOpen
          className="glass-morphism"
          bodyClassName="pt-0"
        >
          <div className="space-y-4">
            <TextAreaGroup
              label="Detail"
              name="detail"
              rows={4}
              required
              value={draft.detail}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  detail: event.target.value,
                }))
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <InputGroup label="Benefit" name="benefit" />
              <InputGroup
                label="Aliases"
                name="aliases"
                placeholder="soybean, soy"
              />
            </div>
            <input type="hidden" name="imagePath" value={imagePath} />
            <TaxonomyImageUploader
              ingredientId={null}
              value={imagePath}
              onChange={setImagePath}
            />
          </div>
        </ProgressiveFormSection>
      ) : null}

      <div
        className={cn(
          "z-layer-sticky-action sticky bottom-6 hidden md:block",
          hasActiveOverlay && "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <div className="flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/56 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <p
            className={cn(
              "text-xs font-medium",
              messageTone === "error" && "text-red-500",
              messageTone === "success" && "text-accent",
              !messageTone && "text-secondary-label"
            )}
          >
            {message ?? "Start a taxonomy draft."}
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="button-primary min-h-[44px] min-w-[132px] px-5 text-[11px] font-semibold uppercase tracking-[0.16em]"
          >
            {isPending ? "Creating" : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}

function TypePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-[42px] rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-200",
        active
          ? "bg-[var(--accent)] text-[var(--accent-label)]"
          : "bg-system-fill/42 text-label hover:bg-system-fill/58"
      )}
    >
      {label}
    </button>
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

function TextAreaGroup({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-2">
      <label className="ml-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {label}
      </label>
      <textarea
        {...props}
        className="flex w-full resize-none rounded-[20px] bg-system-fill/42 px-4 py-3 text-sm text-label outline-none transition-all placeholder:text-tertiary-label focus:bg-system-fill/58"
      />
    </div>
  );
}
