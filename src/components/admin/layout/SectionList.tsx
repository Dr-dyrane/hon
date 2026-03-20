"use client";

import Link from "next/link";
import {
  Box,
  ChevronRight,
  GripVertical,
  Image as ImageIcon,
  Layout as LayoutIcon,
  MousePointer2,
  Settings2,
} from "lucide-react";
import type {
  AdminLayoutSection,
  PublishedPageSection,
} from "@/lib/db/types";
import { cn } from "@/lib/utils";

interface SectionListProps {
  sections: (PublishedPageSection | AdminLayoutSection)[];
  isEditable: boolean;
}

export function SectionList({ sections, isEditable }: SectionListProps) {
  return (
    <div className="grid gap-3 md:gap-4">
      {sections.map((section) => {
        const sectionId = section.sectionId;
        const summaryParts = [
          section.sectionType.toUpperCase(),
          String(section.sortOrder),
          "presentationCount" in section ? `${section.presentationCount}V` : null,
          "bindingCount" in section ? `${section.bindingCount}B` : null,
        ].filter(Boolean);

        return (
          <div
            key={sectionId}
            className={cn(
              "group overflow-hidden rounded-[26px] bg-system-fill/45 p-4 transition-all hover:bg-system-fill/65 md:p-5",
              !section.isEnabled && "opacity-50 grayscale-[0.5]"
            )}
          >
            <div className="flex items-center gap-3">
              {isEditable ? (
                <div className="cursor-grab text-tertiary-label transition-colors hover:text-secondary-label">
                  <GripVertical size={16} />
                </div>
              ) : null}

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-system-background text-accent shadow-soft">
                {getSectionIcon(section.sectionType)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-[15px] font-semibold tracking-tight text-label md:text-base">
                    {section.heading || section.sectionKey}
                  </h4>
                  {!section.isEnabled ? (
                    <span className="inline-flex rounded-full bg-system-fill/60 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-tertiary-label">
                      Hidden
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  {summaryParts.map((part) => (
                    <span key={part}>{part}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {"presentationCount" in section ? (
                  <div className="hidden rounded-full bg-system-fill/60 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-secondary-label md:inline-flex">
                    {section.presentationCount} view
                  </div>
                ) : null}
                {"bindingCount" in section ? (
                  <div className="hidden rounded-full bg-system-fill/60 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-secondary-label md:inline-flex">
                    {section.bindingCount} bind
                  </div>
                ) : null}

                {isEditable ? (
                  <Link
                    href={`/admin/layout/sections/${sectionId}`}
                    aria-label={`Open ${section.heading || section.sectionKey}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-system-fill/60 text-secondary-label transition-all hover:bg-system-background hover:text-label"
                  >
                    <Settings2 size={18} />
                  </Link>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-tertiary-label">
                    <ChevronRight size={18} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getSectionIcon(type: string) {
  switch (type) {
    case "hero":
      return <LayoutIcon size={20} />;
    case "featured_products":
      return <Box size={20} />;
    case "cta":
      return <MousePointer2 size={20} />;
    case "media":
      return <ImageIcon size={20} />;
    default:
      return <LayoutIcon size={20} />;
  }
}
