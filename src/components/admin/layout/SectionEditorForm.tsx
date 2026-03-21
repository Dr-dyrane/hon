"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AdminLayoutSection } from "@/lib/db/types";
import { updateSectionAction } from "@/app/(admin)/admin/layout/actions";

export function SectionEditorForm({
  section,
}: {
  section: AdminLayoutSection;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [isEnabled, setIsEnabled] = useState(section.isEnabled);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setMessageTone(null);

    const formData = new FormData(event.currentTarget);
    formData.set("isEnabled", isEnabled.toString());

    startTransition(async () => {
      const result = await updateSectionAction(formData);

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

  return (
    <form id="admin-layout-section-form" onSubmit={handleSubmit} className="space-y-6 pb-24">
      <input type="hidden" name="sectionId" value={section.sectionId} />

      <div className="grid gap-6 min-[1500px]:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <EditorSection title="Content">
            <div className="space-y-4">
              <InputGroup
                label="Eyebrow"
                name="eyebrow"
                defaultValue={section.eyebrow || ""}
              />
              <InputGroup
                label="Heading"
                name="heading"
                defaultValue={section.heading || ""}
              />
              <TextAreaGroup
                label="Body"
                name="body"
                defaultValue={section.body || ""}
                rows={5}
              />
            </div>
          </EditorSection>
        </div>

        <aside className="space-y-4">
          <EditorSection title="State">
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsEnabled((current) => !current)}
                className="flex min-h-[48px] w-full items-center justify-between rounded-[20px] bg-system-fill/42 px-4 text-left"
              >
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
                    Visibility
                  </p>
                  <p className="mt-1 text-sm font-medium text-label">
                    {isEnabled ? "Shown" : "Hidden"}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex min-w-[58px] justify-center rounded-full px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em]",
                    isEnabled
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-system-fill/52 text-secondary-label"
                  )}
                >
                  {isEnabled ? "On" : "Off"}
                </span>
              </button>

              <SignalCard label="Type" value={section.sectionType} />
              <SignalCard label="Sort" value={`${section.sortOrder}`} />
            </div>
          </EditorSection>
        </aside>
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
            {message ?? "Draft safe."}
          </p>
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              "button-primary min-h-[44px] min-w-[144px] gap-2 px-5 text-[11px] font-semibold uppercase tracking-[0.16em]",
              isPending && "pointer-events-none opacity-50"
            )}
          >
            <Save size={16} />
            <span>{isPending ? "Saving" : "Save"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

function EditorSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
      <h2 className="text-lg font-semibold tracking-tight text-label">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SignalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-system-fill/42 px-4 py-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-label">{value}</p>
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
