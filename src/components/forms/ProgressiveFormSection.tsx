"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ProgressiveFormSectionProps = {
  step: string;
  title: string;
  summary?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
};

export function ProgressiveFormSection({
  step,
  title,
  summary,
  children,
  actions,
  className,
  bodyClassName,
  open,
  onOpenChange,
  defaultOpen = false,
}: ProgressiveFormSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : uncontrolledOpen;

  function setOpen(nextOpen: boolean) {
    onOpenChange?.(nextOpen);

    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
  }

  return (
    <section
      className={cn(
        "rounded-[24px] bg-system-background/86 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:rounded-[28px]",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left md:px-6 md:py-6"
        aria-expanded={isOpen}
      >
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-system-fill/42 text-[10px] font-semibold uppercase tracking-[0.16em] text-label md:h-11 md:w-11 md:text-[11px]">
            {step}
          </span>
          <div className="min-w-0">
            <div className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label md:block">
              Step
            </div>
            <h2 className="text-base font-semibold tracking-tight text-label md:mt-1 md:text-lg">
              {title}
            </h2>
            {summary ? (
              <p className="mt-1 truncate text-xs text-secondary-label md:text-sm">{summary}</p>
            ) : null}
          </div>
        </div>

        <ChevronRight
        className={cn(
          "h-4 w-4 shrink-0 text-secondary-label transition-transform duration-300 ease-[var(--ease-premium)]",
          isOpen && "rotate-90"
          )}
          strokeWidth={1.9}
        />
      </button>

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-[var(--ease-premium)]",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className={cn("px-4 pb-4 pt-1 md:px-6 md:pb-6", bodyClassName)}>
            {children}
            {actions ? <div className="mt-5 flex items-center gap-2">{actions}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
