"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { ProgressiveFormSection } from "@/components/forms/ProgressiveFormSection";
import { useUI } from "@/components/providers/UIProvider";
import { TaxonomyImageUploader } from "@/components/admin/catalog/TaxonomyImageUploader";
import {
  deleteTaxonomyEntryAction,
  updateTaxonomyEntryAction,
} from "@/app/(admin)/admin/catalog/taxonomy/actions";
import type {
  AdminCatalogCategoryDetail,
  AdminCatalogIngredient,
} from "@/lib/db/types";
import { cn } from "@/lib/utils";

type TaxonomyEditorTarget =
  | {
      taxonomyType: "category";
      category: AdminCatalogCategoryDetail;
    }
  | {
      taxonomyType: "ingredient";
      ingredient: AdminCatalogIngredient;
    };

function isDeleteBlocked(target: TaxonomyEditorTarget) {
  if (target.taxonomyType === "category") {
    return target.category.productCount > 0;
  }

  return target.ingredient.variantCount > 0;
}

function toTaxonomyId(target: TaxonomyEditorTarget) {
  if (target.taxonomyType === "category") {
    return target.category.categoryId;
  }

  return target.ingredient.ingredientId;
}

export function TaxonomyEditorForm({ target }: { target: TaxonomyEditorTarget }) {
  const router = useRouter();
  const { hasActiveOverlay } = useUI();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(
    null
  );
  const [imagePath, setImagePath] = useState(
    target.taxonomyType === "ingredient"
      ? target.ingredient.imagePath ?? ""
      : target.category.imagePath ?? ""
  );

  const taxonomyType = target.taxonomyType;
  const taxonomyId = toTaxonomyId(target);
  const deleteBlocked = isDeleteBlocked(target);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageTone(null);

    const formData = new FormData(event.currentTarget);
    formData.set("taxonomyType", taxonomyType);
    formData.set("imagePath", imagePath);

    startTransition(async () => {
      const result = await updateTaxonomyEntryAction(formData);

      if (!result.success) {
        setMessage(result.error || "Unable to save.");
        setMessageTone("error");
        return;
      }

      setMessage("Saved.");
      setMessageTone("success");
      router.refresh();
    });
  }

  function handleDelete() {
    if (deleteBlocked) {
      return;
    }

    setMessage(null);
    setMessageTone(null);

    startTransition(async () => {
      const result = await deleteTaxonomyEntryAction(
        taxonomyType,
        taxonomyId
      );

      if (!result.success) {
        setMessage(result.error || "Unable to delete.");
        setMessageTone("error");
        return;
      }

      router.push(result.redirectTo || "/admin/catalog/taxonomy");
      router.refresh();
    });
  }

  return (
    <form
      id="admin-taxonomy-edit-form"
      onSubmit={handleSubmit}
      className="space-y-6 pb-24"
    >
      <input type="hidden" name="taxonomyType" value={taxonomyType} />
      {taxonomyType === "category" ? (
        <input type="hidden" name="categoryId" value={target.category.categoryId} />
      ) : (
        <input
          type="hidden"
          name="ingredientId"
          value={target.ingredient.ingredientId}
        />
      )}

      <div className="grid gap-6 min-[1500px]:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <EditorSection
            step="01"
            title="Identity"
            summary={
              taxonomyType === "category"
                ? target.category.categoryName
                : target.ingredient.ingredientName
            }
            defaultOpen
          >
            <div className="grid gap-4 md:grid-cols-2">
              {taxonomyType === "category" ? (
                <InputGroup
                  label="Category"
                  name="categoryName"
                  defaultValue={target.category.categoryName}
                  required
                />
              ) : (
                <InputGroup
                  label="Ingredient"
                  name="ingredientName"
                  defaultValue={target.ingredient.ingredientName}
                  required
                />
              )}
              <InputGroup
                label="Sort"
                name="sortOrder"
                type="number"
                defaultValue={
                  taxonomyType === "category"
                    ? target.category.sortOrder
                    : target.ingredient.sortOrder
                }
                required
              />

              {taxonomyType === "category" ? (
                <InputGroup
                  label="Image URL"
                  name="imagePath"
                  value={imagePath}
                  onChange={(event) => setImagePath(event.target.value)}
                  placeholder="/images/products/protein_chocolate.png"
                  className="md:col-span-2"
                />
              ) : null}
            </div>
          </EditorSection>

          {taxonomyType === "ingredient" ? (
            <EditorSection
              step="02"
              title="Profile"
              summary={
                target.ingredient.aliases.length > 0
                  ? `${target.ingredient.aliases.length} aliases`
                  : "Profile"
              }
            >
              <div className="space-y-4">
                <TextAreaGroup
                  label="Detail"
                  name="detail"
                  rows={4}
                  defaultValue={target.ingredient.detail}
                  required
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <InputGroup
                    label="Benefit"
                    name="benefit"
                    defaultValue={target.ingredient.benefit ?? ""}
                  />
                  <InputGroup
                    label="Aliases"
                    name="aliases"
                    defaultValue={target.ingredient.aliases.join(", ")}
                  />
                </div>
                <input type="hidden" name="imagePath" value={imagePath} />
                <TaxonomyImageUploader
                  ingredientId={target.ingredient.ingredientId}
                  value={imagePath}
                  onChange={setImagePath}
                />
              </div>
            </EditorSection>
          ) : null}
        </div>

        <aside className="space-y-4">
          <SignalCard
            title="Links"
            items={
              taxonomyType === "category"
                ? [{ label: "Products", value: `${target.category.productCount}` }]
                : [
                    { label: "Products", value: `${target.ingredient.productCount}` },
                    { label: "Variants", value: `${target.ingredient.variantCount}` },
                  ]
            }
          />
          <SignalCard
            title="Metadata"
            items={
              taxonomyType === "category"
                ? [
                    { label: "Slug", value: target.category.categorySlug },
                    { label: "Sort", value: `${target.category.sortOrder}` },
                  ]
                : [
                    { label: "Slug", value: target.ingredient.ingredientSlug },
                    { label: "Sort", value: `${target.ingredient.sortOrder}` },
                    { label: "Aliases", value: `${target.ingredient.aliases.length}` },
                  ]
            }
          />
          <SignalCard
            title="Delete"
            description={
              deleteBlocked
                ? taxonomyType === "category"
                  ? "Move or archive products first."
                  : "Remove this ingredient from products first."
                : "Safe to delete."
            }
            items={[
              {
                label: "Status",
                value: deleteBlocked ? "Blocked" : "Ready",
              },
            ]}
          />
        </aside>
      </div>

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
              messageTone === "success" && "text-accent",
              messageTone === "error" && "text-red-500",
              !messageTone && "text-secondary-label"
            )}
          >
            {message ?? "Draft safe."}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending || deleteBlocked}
              className={cn(
                "min-h-[44px] rounded-full bg-system-fill/56 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-500 transition-colors duration-200 hover:bg-system-fill/76",
                (isPending || deleteBlocked) && "pointer-events-none opacity-50"
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Icon name="trash" size={15} />
                Delete
              </span>
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "button-primary min-h-[44px] min-w-[144px] gap-2 px-5 text-[11px] font-semibold uppercase tracking-[0.16em]",
                isPending && "pointer-events-none opacity-50"
              )}
            >
              <Icon name="save" size={16} />
              <span>{isPending ? "Saving" : "Save"}</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function EditorSection({
  step,
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  step: string;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <ProgressiveFormSection
      step={step}
      title={title}
      summary={summary}
      defaultOpen={defaultOpen}
      className="glass-morphism"
      bodyClassName="pt-0"
    >
      {children}
    </ProgressiveFormSection>
  );
}

function SignalCard({
  title,
  items,
  description,
}: {
  title: string;
  items: { label: string; value: string }[];
  description?: string;
}) {
  return (
    <section className="glass-morphism rounded-[28px] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-relaxed text-secondary-label">{description}</p>
      ) : null}
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-[18px] bg-system-fill/42 px-4 py-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-medium text-label">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
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

export type { TaxonomyEditorTarget };
