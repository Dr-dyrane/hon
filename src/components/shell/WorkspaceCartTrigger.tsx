"use client";

import { useCommerce } from "@/components/providers/CommerceProvider";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function WorkspaceCartTrigger() {
  const { itemCount, openCart } = useCommerce();
  const feedback = useFeedback();

  return (
    <button
      type="button"
      onClick={() => {
        feedback.selection();
        openCart();
      }}
      className={cn(
        "motion-press-soft relative flex w-full items-center gap-3 squircle bg-[color:var(--surface)]/88 px-2 py-2 shadow-soft transition-colors duration-200 hover:bg-system-fill/70",
        "md:max-lg:justify-center md:max-lg:px-0"
      )}
      aria-label={`Open cart${itemCount > 0 ? ` with ${itemCount} items` : ""}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center squircle bg-system-fill/64 text-label">
        <Icon name="bag" className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </div>

      <div className="min-w-0 text-left md:max-lg:hidden">
        <div className="text-sm font-semibold tracking-tight text-label">Cart</div>
        <div className="text-[11px] text-secondary-label">
          {itemCount > 0 ? `${itemCount} item${itemCount === 1 ? "" : "s"}` : "Open"}
        </div>
      </div>

      {itemCount > 0 ? (
        <span
          className={cn(
            "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-center text-[10px] font-semibold leading-5 tracking-tight text-[var(--accent-label)]",
            "lg:static lg:h-auto lg:min-w-0 lg:px-2 lg:py-1 lg:leading-none"
          )}
        >
          {itemCount}
        </span>
      ) : null}
    </button>
  );
}
