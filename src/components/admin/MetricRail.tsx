import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricRailItem = {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: "default" | "success";
};

const toneClasses: Record<NonNullable<MetricRailItem["tone"]>, string> = {
  default: "text-accent bg-accent/10",
  success: "text-emerald-600 bg-emerald-500/10",
};

export function MetricRail({
  items,
  columns = 3,
}: {
  items: MetricRailItem[];
  columns?: 2 | 3 | 4;
}) {
  const mobileMinWidth =
    items.length <= 4 ? `calc((100% - ${(items.length - 1) * 8}px) / ${items.length})` : "152px";

  return (
    <>
      <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 min-[1500px]:hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const tone = toneClasses[item.tone ?? "default"];

          return (
            <article
              key={item.label}
              style={{ minWidth: mobileMinWidth }}
              className="overflow-hidden rounded-[20px] bg-system-fill/45 px-3 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
                    {item.label}
                  </p>
                  <p className="mt-1 truncate text-[22px] font-semibold tracking-tight text-label">
                    {item.value}
                  </p>
                  {item.detail ? (
                    <p className="mt-1 truncate text-[10px] font-medium text-secondary-label">
                      {item.detail}
                    </p>
                  ) : null}
                </div>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px]",
                    tone
                  )}
                >
                  <Icon size={14} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div
        className={cn(
          "hidden gap-4 min-[1500px]:grid",
          columns === 2 && "md:grid-cols-2",
          columns === 3 && "md:grid-cols-3",
          columns === 4 && "md:grid-cols-4"
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const tone = toneClasses[item.tone ?? "default"];

          return (
            <article
              key={item.label}
              className="overflow-hidden rounded-[28px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
                    {item.label}
                  </p>
                  <p className="mt-3 truncate text-4xl font-semibold tracking-tight text-label">
                    {item.value}
                  </p>
                  {item.detail ? (
                    <p className="mt-3 text-xs text-secondary-label">{item.detail}</p>
                  ) : null}
                </div>
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl",
                    tone
                  )}
                >
                  <Icon size={18} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
