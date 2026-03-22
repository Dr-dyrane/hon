"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type {
  AdminLayoutDraftDetail,
  AdminLayoutVersion,
  PublishedPageSection,
} from "@/lib/db/types";
import {
  createDraftAction,
  publishDraftAction,
  restoreLayoutVersionAction,
} from "@/app/(admin)/admin/layout/actions";
import { SectionList } from "@/components/admin/layout/SectionList";

export function LayoutDashboard({
  publishedSections,
  draftDetail,
  versions,
}: {
  publishedSections: PublishedPageSection[];
  draftDetail: AdminLayoutDraftDetail | null;
  versions: AdminLayoutVersion[];
}) {
  const router = useRouter();
  const [view, setView] = useState<"published" | "draft">(
    draftDetail ? "draft" : "published"
  );
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [busyVersionId, setBusyVersionId] = useState<string | null>(null);

  const hasDraft = Boolean(draftDetail);
  const isEditingDraft = view === "draft" && Boolean(draftDetail);
  const sections = isEditingDraft ? draftDetail!.sections : publishedSections;
  const liveEnabledCount = publishedSections.filter((section) => section.isEnabled).length;
  const draftEnabledCount = draftDetail
    ? draftDetail.sections.filter((section) => section.isEnabled).length
    : 0;
  const publishedVersionId =
    versions.find((version) => version.status === "published")?.versionId ?? null;

  async function handleCreateDraft() {
    setFeedback(null);
    startTransition(async () => {
      const result = await createDraftAction();
      if (result.success) {
        setView("draft");
        setFeedback({
          tone: "success",
          message: hasDraft
            ? "Opened your existing draft."
            : "Draft created. You can edit safely before publishing.",
        });
        router.refresh();
        return;
      }

      setFeedback({
        tone: "error",
        message: result.error || "Failed to create draft.",
      });
    });
  }

  async function handlePublish() {
    if (!draftDetail) {
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      const result = await publishDraftAction(draftDetail.version.versionId);
      if (result.success) {
        setView("published");
        setFeedback({
          tone: "success",
          message: "Layout published. Live homepage has been updated.",
        });
        router.refresh();
        return;
      }

      setFeedback({
        tone: "error",
        message: result.error || "Failed to publish draft.",
      });
    });
  }

  async function handleRestoreVersion(version: AdminLayoutVersion) {
    setFeedback(null);
    setBusyVersionId(version.versionId);

    startTransition(async () => {
      const result = await restoreLayoutVersionAction(version.versionId);

      if (result.success) {
        setView("published");
        setFeedback({
          tone: "success",
          message: `Restored "${version.label}" to live homepage.`,
        });
        setBusyVersionId(null);
        router.refresh();
        return;
      }

      setFeedback({
        tone: "error",
        message: result.error || "Failed to restore this version.",
      });
      setBusyVersionId(null);
    });
  }

  return (
    <div className="space-y-6 pb-20 md:space-y-8">
      {feedback ? (
        <div
          className={cn(
            "z-layer-toast fixed bottom-8 right-8 flex items-center gap-3 rounded-2xl px-6 py-4 shadow-float animate-in fade-in slide-in-from-bottom-4 duration-300",
            feedback.tone === "success"
              ? "bg-accent/10 text-accent backdrop-blur-xl"
              : "bg-red-500/10 text-red-500 backdrop-blur-xl"
          )}
        >
          {feedback.tone === "success" ? (
            <Icon name="check-circle" size={20} />
          ) : (
            <Icon name="info" size={20} />
          )}
          <span className="text-sm font-medium">{feedback.message}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col gap-3 min-[1500px]:flex-row min-[1500px]:items-center min-[1500px]:justify-between">
          <div className="rounded-[22px] bg-system-fill/42 p-1.5 backdrop-blur-xl">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setView("published")}
                className={cn(
                  "flex min-h-[42px] items-center justify-center gap-2 rounded-[18px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all",
                  view === "published"
                    ? "bg-system-fill/82 text-label shadow-soft"
                    : "text-secondary-label hover:text-label"
                )}
              >
                <Icon name="history" size={14} />
                <span>Live</span>
              </button>
              <button
                onClick={() => setView("draft")}
                disabled={!hasDraft}
                className={cn(
                  "flex min-h-[42px] items-center justify-center gap-2 rounded-[18px] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all",
                  view === "draft"
                    ? "bg-system-fill/82 text-label shadow-soft"
                    : "text-secondary-label hover:text-label",
                  !hasDraft && "cursor-not-allowed opacity-30"
                )}
              >
                <Icon name="layout" size={14} />
                <span>Draft</span>
              </button>
            </div>
          </div>

          <div className="rounded-[22px] bg-system-fill/42 p-1.5 backdrop-blur-xl self-start min-[1500px]:self-auto">
            <div className="flex items-center gap-1.5">
              {hasDraft ? (
                view === "draft" ? (
                  <>
                    <a
                      href="/?preview=true"
                      target="_blank"
                      aria-label="Preview"
                      className="flex min-h-[42px] min-w-[42px] items-center justify-center rounded-[18px] text-secondary-label transition-all hover:bg-system-fill/82 hover:text-label"
                    >
                      <Icon name="search" size={16} />
                    </a>
                    <button
                      onClick={handlePublish}
                      disabled={isPending}
                      className="button-primary min-h-[42px] gap-2 px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                    >
                      <Icon name="navigation" size={16} />
                      <span>{isPending ? "Publishing" : "Publish Live"}</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setView("draft")}
                    disabled={isPending}
                    className="button-primary min-h-[42px] gap-2 px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  >
                    <Icon name="layout" size={16} />
                    <span>Open Draft</span>
                  </button>
                )
              ) : (
                <>
                  <button
                    onClick={handleCreateDraft}
                    disabled={isPending}
                    className="button-primary min-h-[42px] gap-2 px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  >
                    <Icon name="plus" size={16} />
                    <span>{isPending ? "Starting" : "Create Draft"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="glass-morphism rounded-[24px] px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.04)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-accent/10 text-accent">
              {view === "published" ? <Icon name="check-circle" size={18} /> : <Icon name="layout" size={18} />}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold tracking-tight text-label">
                {view === "published" ? "Live homepage" : "Draft workspace"}
              </h3>
              <p className="mt-0.5 text-sm text-secondary-label">
                {view === "published"
                  ? hasDraft
                    ? "Customers see this version. A private draft is ready for review."
                    : "Customers see this version. Create a draft to make safe edits."
                  : `${draftDetail?.version.label}. Changes stay private until publish.`}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-system-fill/56 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  Live {liveEnabledCount} enabled
                </span>
                <span className="rounded-full bg-system-fill/56 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  Draft {hasDraft ? `${draftEnabledCount} enabled` : "none"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-secondary-label">
            Content Sections ({sections.length})
          </h2>
          <span className="text-[10px] font-medium text-tertiary-label">
            {isEditingDraft ? "Editable draft" : "Live read only"}
          </span>
        </div>

        <SectionList sections={sections} isEditable={isEditingDraft} />
      </div>

      <section className="glass-morphism rounded-[24px] p-4 shadow-[0_12px_24px_rgba(15,23,42,0.04)] md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary-label">
              Version History
            </h3>
            <p className="mt-1 text-sm text-secondary-label">
              Restore any archived version if a publish goes wrong.
            </p>
          </div>
          <span className="rounded-full bg-system-fill/56 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
            {versions.length}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {versions.map((version) => {
            const isCurrentPublished = publishedVersionId === version.versionId;
            const isArchived = version.status === "archived";
            const isDraftVersion = version.status === "draft";
            const isBusy = busyVersionId === version.versionId;

            return (
              <div
                key={version.versionId}
                className="flex flex-col gap-3 rounded-[18px] bg-system-fill/42 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight text-label">
                    {version.label}
                  </p>
                  <p className="mt-0.5 text-xs text-secondary-label">
                    {version.publishedAt
                      ? `Published ${formatVersionDate(version.publishedAt)}`
                      : `Updated ${formatVersionDate(version.updatedAt)}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={version.status} />

                  {isArchived ? (
                    <button
                      type="button"
                      onClick={() => void handleRestoreVersion(version)}
                      disabled={isPending || isBusy}
                      className="rounded-full bg-[color:var(--surface)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-[color:var(--surface)]/88 disabled:opacity-50"
                    >
                      {isBusy ? "Restoring" : "Restore"}
                    </button>
                  ) : null}

                  {isDraftVersion ? (
                    <button
                      type="button"
                      onClick={() => setView("draft")}
                      className="rounded-full bg-[color:var(--surface)] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-[color:var(--surface)]/88"
                    >
                      Open Draft
                    </button>
                  ) : null}

                  {isCurrentPublished ? (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-tertiary-label">
                      Current live
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function formatVersionDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({
  status,
}: {
  status: AdminLayoutVersion["status"];
}) {
  const classes =
    status === "published"
      ? "bg-accent/12 text-accent"
      : status === "draft"
        ? "bg-system-fill/70 text-label"
        : "bg-system-fill/56 text-secondary-label";

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
        classes
      )}
    >
      {status === "published" ? "Live" : status === "draft" ? "Draft" : "Archived"}
    </span>
  );
}
