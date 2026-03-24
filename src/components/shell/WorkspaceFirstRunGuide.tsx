"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type FirstRunGuideScope = "admin" | "portal";

type GuideStep = {
  id: string;
  title: string;
  detail: string;
  targetSelector: string;
  pathPrefix?: string;
  pathExact?: string;
};

const GUIDE_STORAGE_PREFIX = "hop:first-run-guide";
const GUIDE_VERSION = "2026-03-mobile-v1";

const GUIDE_STEPS: Record<FirstRunGuideScope, GuideStep[]> = {
  admin: [
    {
      id: "mobile-nav",
      title: "Bottom dock",
      detail:
        "Use this for fast section switching. Keep triage work in one flow instead of jumping through deep pages.",
      targetSelector: '[data-tour-id="workspace-mobile-nav"]',
    },
    {
      id: "mobile-fab",
      title: "Quick action button",
      detail:
        "This floating button is the fastest safe action for this screen. Use it for single-step tasks.",
      targetSelector: '[data-tour-id="workspace-mobile-fab"]',
    },
    {
      id: "notifications",
      title: "Milestone alerts",
      detail:
        "Open this for payment, delivery, and return exceptions. Clear alerts before non-urgent work.",
      targetSelector: '[data-tour-id="workspace-notifications-trigger"]',
    },
    {
      id: "primary-queue",
      title: "Primary queue entry",
      detail:
        "This is your first move when you start a shift. It routes you to the highest-priority queue.",
      targetSelector: '[data-tour-id="admin-overview-primary-action"]',
      pathExact: "/admin",
    },
    {
      id: "queue-grid",
      title: "Detailed queue actions",
      detail:
        "Use queue cards for detailed actions like payment review and dispatch follow-through.",
      targetSelector: '[data-tour-id="admin-overview-queue-grid"]',
      pathExact: "/admin",
    },
  ],
  portal: [
    {
      id: "mobile-nav",
      title: "Bottom dock",
      detail:
        "Use this dock to switch between store, orders, places, reviews, and profile.",
      targetSelector: '[data-tour-id="workspace-mobile-nav"]',
    },
    {
      id: "mobile-fab",
      title: "Quick action button",
      detail:
        "This button changes by route. It handles your fastest action, like opening cart or saving forms.",
      targetSelector: '[data-tour-id="workspace-mobile-fab"]',
    },
    {
      id: "notifications",
      title: "Order updates",
      detail:
        "Track payment and delivery changes from here without opening each order.",
      targetSelector: '[data-tour-id="workspace-notifications-trigger"]',
    },
  ],
};

function subscribeNoop() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function subscribeMobileQuery(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const media = window.matchMedia("(max-width: 767px)");
  const handler = () => onStoreChange();
  media.addEventListener("change", handler);

  return () => {
    media.removeEventListener("change", handler);
  };
}

function getMobileSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia("(max-width: 767px)").matches;
}

function getMobileServerSnapshot() {
  return false;
}

function stepMatchesPath(step: GuideStep, pathname: string) {
  if (step.pathExact) {
    return pathname === step.pathExact;
  }

  if (step.pathPrefix) {
    return pathname.startsWith(step.pathPrefix);
  }

  return true;
}

function getGuideStorageKey(scope: FirstRunGuideScope) {
  return `${GUIDE_STORAGE_PREFIX}:${scope}:${GUIDE_VERSION}`;
}

export function WorkspaceFirstRunGuide({ scope }: { scope: FirstRunGuideScope }) {
  const pathname = usePathname();
  const [stepIndex, setStepIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const highlightedTargetRef = useRef<HTMLElement | null>(null);
  const isClient = useSyncExternalStore(
    subscribeNoop,
    getClientSnapshot,
    getServerSnapshot
  );
  const isMobile = useSyncExternalStore(
    subscribeMobileQuery,
    getMobileSnapshot,
    getMobileServerSnapshot
  );

  const steps = useMemo(() => {
    return GUIDE_STEPS[scope].filter((step) => stepMatchesPath(step, pathname));
  }, [pathname, scope]);

  const safeStepIndex = stepIndex >= steps.length ? 0 : stepIndex;
  const step = steps[safeStepIndex] ?? null;
  const hasSeen =
    isClient && window.localStorage.getItem(getGuideStorageKey(scope)) === "done";
  const isOpen = isClient && isMobile && !hasSeen && !isDismissed && steps.length > 0;

  useEffect(() => {
    if (!isOpen || !step) {
      if (highlightedTargetRef.current) {
        highlightedTargetRef.current.removeAttribute("data-tour-active");
        highlightedTargetRef.current = null;
      }
      return;
    }

    if (highlightedTargetRef.current) {
      highlightedTargetRef.current.removeAttribute("data-tour-active");
      highlightedTargetRef.current = null;
    }

    const target = document.querySelector(step.targetSelector);
    if (!(target instanceof HTMLElement)) {
      return;
    }

    target.setAttribute("data-tour-active", "true");
    highlightedTargetRef.current = target;
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    return () => {
      if (highlightedTargetRef.current === target) {
        target.removeAttribute("data-tour-active");
        highlightedTargetRef.current = null;
      }
    };
  }, [isOpen, pathname, step]);

  useEffect(() => {
    return () => {
      if (highlightedTargetRef.current) {
        highlightedTargetRef.current.removeAttribute("data-tour-active");
        highlightedTargetRef.current = null;
      }
    };
  }, []);

  if (!isOpen || !step) {
    return null;
  }

  const atFirstStep = safeStepIndex === 0;
  const atLastStep = safeStepIndex === steps.length - 1;

  const closeGuide = () => {
    window.localStorage.setItem(getGuideStorageKey(scope), "done");
    if (highlightedTargetRef.current) {
      highlightedTargetRef.current.removeAttribute("data-tour-active");
      highlightedTargetRef.current = null;
    }
    setIsDismissed(true);
  };

  const handleNext = () => {
    if (atLastStep) {
      closeGuide();
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  return (
    <section
      aria-live="polite"
      className="fixed inset-x-3 z-layer-popover bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] md:hidden"
    >
      <div className="workspace-surface squircle px-4 py-4 shadow-[0_20px_42px_rgba(15,23,42,0.16)]">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
            First-run guide
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-headline text-tertiary-label">
            {safeStepIndex + 1}/{steps.length}
          </p>
        </div>

        <div className="mt-2 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-label">{step.title}</h2>
          <p className="text-sm leading-snug text-secondary-label">{step.detail}</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={closeGuide}
            className="inline-flex min-h-[38px] items-center rounded-full bg-system-fill/64 px-4 text-xs font-semibold tracking-tight text-secondary-label transition-colors duration-200 hover:bg-system-fill"
          >
            Skip
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={atFirstStep}
              className={cn(
                "inline-flex min-h-[38px] items-center rounded-full px-4 text-xs font-semibold tracking-tight transition-colors duration-200",
                atFirstStep
                  ? "bg-system-fill/34 text-tertiary-label"
                  : "bg-system-fill/64 text-label hover:bg-system-fill"
              )}
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex min-h-[38px] items-center rounded-full bg-[var(--accent)] px-4 text-xs font-semibold tracking-tight text-[var(--accent-label)] transition-opacity duration-200 hover:opacity-90"
            >
              {atLastStep ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
