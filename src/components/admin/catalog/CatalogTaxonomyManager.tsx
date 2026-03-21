"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type {
  AdminCatalogCategoryDetail,
  AdminCatalogIngredient,
} from "@/lib/db/types";
import {
  createCatalogCategoryAction,
  createCatalogIngredientAction,
  deleteCatalogCategoryAction,
  deleteCatalogIngredientAction,
  updateCatalogCategoryAction,
  updateCatalogIngredientAction,
} from "@/app/(admin)/admin/catalog/taxonomy/actions";
import { cn } from "@/lib/utils";

export function CatalogTaxonomyManager({
  categories,
  ingredients,
}: {
  categories: AdminCatalogCategoryDetail[];
  ingredients: AdminCatalogIngredient[];
}) {
  return (
    <div className="grid gap-6 2xl:grid-cols-[0.78fr_1.22fr]">
      <section className="space-y-4">
        <ComposerCard title="New Category">
          <CategoryComposer />
        </ComposerCard>
        <div className="space-y-3">
          {categories.map((category) => (
            <CategoryCard key={category.categoryId} category={category} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <ComposerCard title="New Ingredient">
          <IngredientComposer />
        </ComposerCard>
        <div className="space-y-3">
          {ingredients.map((ingredient) => (
            <IngredientCard key={ingredient.ingredientId} ingredient={ingredient} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ComposerCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-morphism rounded-[32px] p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CategoryComposer() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await createCatalogCategoryAction(formData);

          if (!result.success) {
            setMessage(result.error || "Unable to create.");
            return;
          }

          event.currentTarget.reset();
          setMessage("Created.");
          router.refresh();
        });
      }}
      className="space-y-3"
    >
      <Field label="Name" name="categoryName" required />
      <Field label="Sort" name="sortOrder" type="number" defaultValue="0" />
      <ActionRow message={message} pending={isPending} submitLabel="Create" />
    </form>
  );
}

function CategoryCard({ category }: { category: AdminCatalogCategoryDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        formData.set("categoryId", category.categoryId);

        startTransition(async () => {
          const result = await updateCatalogCategoryAction(formData);

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
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_100px]">
        <Field label="Name" name="categoryName" defaultValue={category.categoryName} required />
        <Field label="Sort" name="sortOrder" type="number" defaultValue={`${category.sortOrder}`} />
        <MetricPill label="Products" value={`${category.productCount}`} />
      </div>
      <ActionRow
        message={message ?? (category.productCount > 0 ? "Delete blocked while products use this category." : "Ready.")}
        pending={isPending}
        submitLabel="Save"
        dangerLabel="Delete"
        onDanger={() =>
          startTransition(async () => {
            setMessage(null);
            const result = await deleteCatalogCategoryAction(category.categoryId);

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

function IngredientComposer() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await createCatalogIngredientAction(formData);

          if (!result.success) {
            setMessage(result.error || "Unable to create.");
            return;
          }

          event.currentTarget.reset();
          setMessage("Created.");
          router.refresh();
        });
      }}
      className="grid gap-3 md:grid-cols-2"
    >
      <Field label="Name" name="ingredientName" required />
      <Field label="Sort" name="sortOrder" type="number" defaultValue="0" />
      <TextField
        label="Detail"
        name="detail"
        required
        className="md:col-span-2"
        rows={3}
      />
      <Field label="Benefit" name="benefit" />
      <Field label="Aliases" name="aliases" placeholder="soybean, soy" />
      <Field label="Image" name="imagePath" className="md:col-span-2" />
      <div className="md:col-span-2">
        <ActionRow message={message} pending={isPending} submitLabel="Create" />
      </div>
    </form>
  );
}

function IngredientCard({ ingredient }: { ingredient: AdminCatalogIngredient }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        const formData = new FormData(event.currentTarget);
        formData.set("ingredientId", ingredient.ingredientId);

        startTransition(async () => {
          const result = await updateCatalogIngredientAction(formData);

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
      <div className="grid gap-3 md:grid-cols-2">
        <Field
          label="Name"
          name="ingredientName"
          defaultValue={ingredient.ingredientName}
          required
        />
        <Field
          label="Sort"
          name="sortOrder"
          type="number"
          defaultValue={`${ingredient.sortOrder}`}
        />
        <TextField
          label="Detail"
          name="detail"
          defaultValue={ingredient.detail}
          className="md:col-span-2"
          rows={3}
          required
        />
        <Field label="Benefit" name="benefit" defaultValue={ingredient.benefit ?? ""} />
        <Field
          label="Aliases"
          name="aliases"
          defaultValue={ingredient.aliases.join(", ")}
        />
        <Field
          label="Image"
          name="imagePath"
          defaultValue={ingredient.imagePath ?? ""}
          className="md:col-span-2"
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricPill label="Variants" value={`${ingredient.variantCount}`} />
        <MetricPill label="Products" value={`${ingredient.productCount}`} />
      </div>
      <ActionRow
        message={
          message ??
          (ingredient.variantCount > 0
            ? "Delete blocked while products use this ingredient."
            : "Ready.")
        }
        pending={isPending}
        submitLabel="Save"
        dangerLabel="Delete"
        onDanger={() =>
          startTransition(async () => {
            setMessage(null);
            const result = await deleteCatalogIngredientAction(ingredient.ingredientId);

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

function TextField({
  label,
  className,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={cn("space-y-2", className)}>
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
