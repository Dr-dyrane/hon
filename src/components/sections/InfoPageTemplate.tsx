import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export type InfoPageSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export type InfoPageAction = {
  label: string;
  href: string;
  tone?: "primary" | "secondary";
  external?: boolean;
};

export function InfoPageTemplate({
  eyebrow,
  title,
  summary,
  lastUpdated,
  sections,
  actions = [],
}: {
  eyebrow: string;
  title: string;
  summary: string;
  lastUpdated: string;
  sections: InfoPageSection[];
  actions?: InfoPageAction[];
}) {
  return (
    <div className="min-h-svh workspace-shell-native px-4 pb-16 pt-5 sm:px-6 sm:pb-20 sm:pt-6">
      <div className="w-full">
        <header className="workspace-surface squircle px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" aria-label="House of Prax home">
              <Logo />
            </Link>

            <nav
              aria-label="Info navigation"
              className="flex items-center gap-1 text-[10px] font-mono font-medium uppercase tracking-[0.24em] text-secondary-label"
            >
              <Link
                href="/help"
                className="rounded-full px-3 py-2 transition-colors duration-200 hover:bg-system-fill/72 hover:text-label"
              >
                Help
              </Link>
              <Link
                href="/support"
                className="rounded-full px-3 py-2 transition-colors duration-200 hover:bg-system-fill/72 hover:text-label"
              >
                Support
              </Link>
            </nav>
          </div>
        </header>

        <main className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
          <section className="workspace-surface squircle px-5 py-6 sm:px-8 sm:py-8">
            <div className="grid gap-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:items-end">
              <div>
                <p className="text-[10px] font-mono font-medium uppercase tracking-[0.38em] text-accent">
                  {eyebrow}
                </p>
                <h1 className="mt-2 text-[clamp(2.6rem,9vw,6.8rem)] font-light leading-[0.86] tracking-[-0.055em] text-label">
                  {title}
                </h1>
                <p className="mt-4 text-[clamp(1rem,2.4vw,1.35rem)] font-light leading-snug text-secondary-label">
                  {summary}
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-mono font-medium uppercase tracking-[0.28em] text-tertiary-label">
                  Last updated {lastUpdated}
                </p>

                {actions.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {actions.map((action) => (
                      <Link
                        key={`${action.label}-${action.href}`}
                        href={action.href}
                        target={action.external ? "_blank" : undefined}
                        rel={action.external ? "noreferrer noopener" : undefined}
                        className={
                          action.tone === "secondary"
                            ? "button-secondary min-h-[40px] px-4 text-[10px] font-mono font-medium uppercase tracking-[0.2em]"
                            : "button-primary min-h-[40px] px-4 text-[10px] font-mono font-medium uppercase tracking-[0.2em]"
                        }
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:gap-4 xl:grid-cols-2">
            {sections.map((section) => (
              <article
                key={section.title}
                className="workspace-surface squircle px-5 py-5 sm:px-6 sm:py-6"
              >
                <p className="text-[10px] font-mono font-medium uppercase tracking-[0.24em] text-tertiary-label">
                  Section
                </p>
                <h2 className="mt-2 text-[clamp(1.35rem,2.7vw,2.2rem)] font-light leading-tight tracking-[-0.025em] text-label">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="mt-3 text-[0.98rem] font-light leading-relaxed text-secondary-label"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.items?.length ? (
                  <ul className="mt-3 space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2 text-[0.96rem] text-label">
                        <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <span className="font-light leading-relaxed text-secondary-label">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
