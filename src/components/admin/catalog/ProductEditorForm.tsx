"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { type AdminCatalogProductDetail } from "@/lib/db/types";
import { updateProductAction } from "@/app/(admin)/admin/catalog/products/[productId]/actions";
import { Save, AlertCircle, CheckCircle2, Package, Tag, Layers, Globe } from "lucide-react";

export function ProductEditorForm({ product }: { product: AdminCatalogProductDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const result = await updateProductAction(formData);
      if (result.success) {
        setSuccess(true);
        router.refresh();
      } else {
        setError(result.error || "An unexpected error occurred.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      <input type="hidden" name="productId" value={product.productId} />
      
      {/* Feedback Toast (Subtle) */}
      {(success || error) && (
        <div className={cn(
          "fixed bottom-8 right-8 z-50 flex items-center gap-3 rounded-2xl px-6 py-4 shadow-float animate-in fade-in slide-in-from-bottom-4 duration-300",
          success ? "bg-accent/10 text-accent backdrop-blur-xl" : "bg-red-500/10 text-red-500 backdrop-blur-xl"
        )}>
          {success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">
            {success ? "Changes saved successfully" : error}
          </span>
        </div>
      )}

      {/* Identity Section */}
      <EditorSection 
        title="Identity" 
        description="The core brand and identifying information for this product family."
        icon={<Tag size={20} className="text-accent" />}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <InputGroup label="Internal Name" name="productName" defaultValue={product.productName} required />
          <InputGroup label="Marketing Name" name="marketingName" defaultValue={product.productMarketingName || ""} placeholder="e.g. Vanilla Power" />
          <InputGroup label="Tagline" name="tagline" defaultValue={product.productTagline || ""} placeholder="e.g. Clean Energy for the Modern Mind" className="md:col-span-2" />
        </div>
        <div className="mt-6 space-y-6">
          <TextAreaGroup label="Short Description" name="shortDescription" defaultValue={product.shortDescription} required rows={3} />
          <TextAreaGroup label="Long Description" name="longDescription" defaultValue={product.longDescription || ""} rows={6} />
        </div>
      </EditorSection>

      {/* Pricing & Default Variant */}
      <EditorSection 
        title="Variant & Pricing" 
        description="Settings for the default sellable unit. Currently, Rendezvous focused on single-variant products."
        icon={<Layers size={20} className="text-accent" />}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <InputGroup label="Variant Name" name="variantName" defaultValue={product.variantName} required />
          <InputGroup label="SKU" name="sku" defaultValue={product.sku} readOnly className="opacity-60" />
          <InputGroup label="Price (NGN)" name="priceNgn" type="number" defaultValue={product.priceNgn} required />
          <InputGroup label="Compare-at Price (NGN)" name="compareAtPriceNgn" type="number" defaultValue={product.compareAtPriceNgn || ""} />
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <SelectGroup 
            label="Variant Status" 
            name="variantStatus" 
            defaultValue={product.variantStatus}
            options={[
              { label: "Draft", value: "draft" },
              { label: "Active", value: "active" },
              { label: "Archived", value: "archived" },
            ]}
          />
          <InputGroup label="Size Label" name="sizeLabel" defaultValue={product.sizeLabel || ""} placeholder="e.g. 500" />
          <InputGroup label="Unit Label" name="unitLabel" defaultValue={product.unitLabel || ""} placeholder="e.g. g" />
        </div>
      </EditorSection>

      {/* Inventory Management */}
      <EditorSection 
        title="Inventory" 
        description="Stock levels and reorder triggers for this variant."
        icon={<Package size={20} className="text-accent" />}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <InputGroup label="Available Stock" name="inventoryOnHand" type="number" defaultValue={product.inventoryOnHand || 0} required />
          <InputGroup label="Reorder Threshold" name="reorderThreshold" type="number" defaultValue={product.reorderThreshold || ""} placeholder="Notify when below..." />
        </div>
      </EditorSection>

      {/* Merchandising & Visibility */}
      <EditorSection 
        title="Merchandising" 
        description="Control how this product is presented and ranked in the catalog."
        icon={<Globe size={20} className="text-accent" />}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <SelectGroup 
            label="Product Status" 
            name="status" 
            defaultValue={product.status}
            options={[
              { label: "Draft", value: "draft" },
              { label: "Active", value: "active" },
              { label: "Archived", value: "archived" },
            ]}
          />
          <SelectGroup 
            label="Merchandising" 
            name="merchandisingState" 
            defaultValue={product.merchandisingState}
            options={[
              { label: "Standard", value: "standard" },
              { label: "Featured", value: "featured" },
              { label: "Hidden", value: "hidden" },
            ]}
          />
          <SelectGroup 
            label="Available for Sale" 
            name="isAvailable" 
            defaultValue={product.isAvailable ? "true" : "false"}
            options={[
              { label: "Yes", value: "true" },
              { label: "No", value: "false" },
            ]}
          />
          <InputGroup label="Sort Order" name="sortOrder" type="number" defaultValue={product.sortOrder} required />
        </div>
      </EditorSection>

      {/* Actions */}
      <div className="sticky bottom-8 z-40 mt-12 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "button-primary h-14 min-w-[200px] gap-3 px-8 text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95",
            isPending && "opacity-50 pointer-events-none"
          )}
        >
          {isPending ? (
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
          ) : (
            <Save size={18} />
          )}
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function EditorSection({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="liquid-glass bg-system-background/60 p-8 md:p-10">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-system-fill/50">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-title text-label">{title}</h3>
          <p className="mt-1 text-sm text-secondary-label">{description}</p>
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

function InputGroup({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("space-y-2", props.className)}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-label ml-1">
        {label}
      </label>
      <input
        {...props}
        className={cn(
          "flex w-full rounded-2xl bg-system-fill/40 px-5 py-4 text-sm text-label transition-all focus:bg-system-fill/60 focus:ring-2 focus:ring-accent/20",
          props.className
        )}
      />
    </div>
  );
}

function TextAreaGroup({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-label ml-1">
        {label}
      </label>
      <textarea
        {...props}
        className="flex w-full resize-none rounded-2xl bg-system-fill/40 px-5 py-4 text-sm text-label transition-all focus:bg-system-fill/60 focus:ring-2 focus:ring-accent/20"
      />
    </div>
  );
}

function SelectGroup({ label, options, ...props }: { label: string; options: { label: string; value: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-label ml-1">
        {label}
      </label>
      <select
        {...props}
        className="flex w-full appearance-none rounded-2xl bg-system-fill/40 px-5 py-4 text-sm text-label transition-all focus:bg-system-fill/60 focus:ring-2 focus:ring-accent/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
