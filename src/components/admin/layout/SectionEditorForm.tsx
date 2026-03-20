"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { type AdminLayoutSection } from "@/lib/db/types";
import { updateSectionAction } from "@/app/(admin)/admin/layout/actions";
import { 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Type, 
  Eye, 
  EyeOff,
  Settings
} from "lucide-react";

export function SectionEditorForm({ section }: { section: AdminLayoutSection }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEnabled, setIsEnabled] = useState(section.isEnabled);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    formData.set("isEnabled", isEnabled.toString());
    
    startTransition(async () => {
      const result = await updateSectionAction(formData);
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
      <input type="hidden" name="sectionId" value={section.sectionId} />
      
      {/* Feedback Toast */}
      {(success || error) && (
        <div className={cn(
          "fixed bottom-8 right-8 z-50 flex items-center gap-3 rounded-2xl px-6 py-4 shadow-float animate-in fade-in slide-in-from-bottom-4 duration-300",
          success ? "bg-accent/10 text-accent backdrop-blur-xl" : "bg-red-500/10 text-red-500 backdrop-blur-xl"
        )}>
          {success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">
            {success ? "Section updated successfully" : error}
          </span>
        </div>
      )}

      <div className="liquid-glass flex items-center justify-between bg-system-background/60 p-6 transition-all">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
            isEnabled ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
          )}>
            {isEnabled ? <Eye size={18} /> : <EyeOff size={18} />}
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-label">Visibility</h3>
            <p className="text-xs text-secondary-label">
              {isEnabled ? "Shown when published." : "Hidden when published."}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsEnabled(!isEnabled)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent/20",
            isEnabled ? "bg-accent" : "bg-system-fill"
          )}
        >
          <span className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            isEnabled ? "translate-x-5" : "translate-x-0"
          )} />
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <EditorSection 
            title="Content" 
            description="Copy"
            icon={<Type size={20} className="text-accent" />}
          >
            <div className="space-y-6">
              <InputGroup label="Eyebrow Label" name="eyebrow" defaultValue={section.eyebrow || ""} placeholder="e.g. NEW ARRIVAL" />
              <InputGroup label="Primary Heading" name="heading" defaultValue={section.heading || ""} placeholder="e.g. Elevate Your Energy" />
              <TextAreaGroup label="Section Body" name="body" defaultValue={section.body || ""} rows={4} placeholder="Detailed description or supporting copy..." />
            </div>
          </EditorSection>
        </div>

        <div className="space-y-8">
          <EditorSection 
            title="Settings" 
            description="Read only"
            icon={<Settings size={20} className="text-accent" />}
          >
            <div className="space-y-6 opacity-60 pointer-events-none">
              <InputGroup label="Section Type" value={section.sectionType} readOnly />
              <InputGroup label="Sort Order" value={section.sortOrder} readOnly />
            </div>
            <div className="mt-6 rounded-[24px] bg-system-fill/50 p-4">
              <p className="text-[10px] font-medium leading-relaxed text-amber-600/80">
                Structure changes stay in code.
              </p>
            </div>
          </EditorSection>
        </div>
      </div>

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
          {isPending ? "Saving..." : "Save"}
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
    <div className="space-y-2">
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
