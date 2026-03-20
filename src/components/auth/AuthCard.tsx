import type { ReactNode } from "react";

export function AuthCard({
  badge,
  title,
  description,
  footer,
  children,
}: {
  badge: string;
  title: string;
  description: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="glass-morphism rounded-[40px] bg-system-background/84 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)] sm:p-8">
      <div className="inline-flex rounded-full bg-accent/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-accent dark:bg-accent/15">
        {badge}
      </div>

      <h1 className="mt-5 text-4xl font-bold tracking-display text-label sm:text-5xl">
        {title}
      </h1>
      <div className="mt-4 text-base leading-relaxed text-secondary-label">
        {description}
      </div>

      <div className="mt-8">{children}</div>

      {footer ? <div className="mt-6 text-sm text-secondary-label">{footer}</div> : null}
    </section>
  );
}
