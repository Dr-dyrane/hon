import type { CSSProperties } from "react";
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

function getCompactGridClass(columns: 2 | 3 | 4) {
  if (columns === 2) {
    return "md:grid-cols-2";
  }

  if (columns === 3) {
    return "md:grid-cols-2 lg:grid-cols-3";
  }

  return "md:grid-cols-2 lg:grid-cols-4";
}

function getWideGridClass(columns: 2 | 3 | 4) {
  if (columns === 2) {
    return "min-[1500px]:grid-cols-2";
  }

  if (columns === 3) {
    return "min-[1500px]:grid-cols-3";
  }

  return "min-[1500px]:grid-cols-4";
}

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
      <div className="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 md:hidden">
        {items.map((item) => {
          return (
            <MetricCard
              key={item.label}
              item={item}
              size="mobile"
              style={{ minWidth: mobileMinWidth }}
            />
          );
        })}
      </div>

      <div
        className={cn(
          "hidden gap-4 md:grid min-[1500px]:hidden",
          getCompactGridClass(columns)
        )}
      >
        {items.map((item) => {
          return (
            <MetricCard
              key={item.label}
              item={item}
              size="compact"
            />
          );
        })}
      </div>

      <div
        className={cn(
          "hidden gap-4 min-[1500px]:grid",
          getWideGridClass(columns)
        )}
      >
        {items.map((item) => {
          return (
            <MetricCard
              key={item.label}
              item={item}
              size="full"
            />
          );
        })}
      </div>
    </>
  );
}

function MetricCard({
  item,
  size,
  style,
}: {
  item: MetricRailItem;
  size: "mobile" | "compact" | "full";
  style?: CSSProperties;
}) {
  const Icon = item.icon;
  const tone = toneClasses[item.tone ?? "default"];

  if (size === "mobile") {
    return (
      <article
        style={style}
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
  }

  if (size === "compact") {
    return (
      <article className="overflow-hidden rounded-[24px] bg-system-background/84 px-4 py-4 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
              {item.label}
            </p>
            <p className="mt-2 truncate text-[28px] font-semibold tracking-tight text-label">
              {item.value}
            </p>
            {item.detail ? (
              <p className="mt-2 truncate text-[11px] text-secondary-label">{item.detail}</p>
            ) : null}
          </div>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px]",
              tone
            )}
          >
            <Icon size={16} />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-[28px] bg-system-background/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
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
}
