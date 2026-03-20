import { cn } from "@/lib/utils";

type QuietValueItem = {
  label: string;
  value: string;
  detail?: string | null;
};

const gridClassMap = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
} as const;

export function QuietValueStrip({
  items,
  columns = 4,
}: {
  items: QuietValueItem[];
  columns?: 2 | 3 | 4;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex snap-x gap-3 overflow-x-auto pb-1 md:hidden">
        {items.map((item) => (
          <ValueTile
            key={`${item.label}-${item.value}`}
            item={item}
            className="min-w-[148px] snap-start"
            detailClassName="hidden"
          />
        ))}
      </div>

      <div className={cn("hidden gap-3 md:grid", gridClassMap[columns])}>
        {items.map((item) => (
          <ValueTile key={`${item.label}-${item.value}`} item={item} />
        ))}
      </div>
    </>
  );
}

function ValueTile({
  item,
  className,
  detailClassName,
}: {
  item: QuietValueItem;
  className?: string;
  detailClassName?: string;
}) {
  return (
    <div className={cn("rounded-[24px] bg-system-fill/42 px-4 py-3", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary-label">
        {item.label}
      </p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-label">{item.value}</p>
      {item.detail ? (
        <p className={cn("mt-1 text-xs text-secondary-label", detailClassName)}>{item.detail}</p>
      ) : null}
    </div>
  );
}
