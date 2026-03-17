import { cn } from "@/lib/utils";
import React, { forwardRef } from "react";

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: "white" | "alt";
  id?: string;
}

export const SectionContainer = forwardRef<HTMLElement, SectionContainerProps>(({
  children,
  className,
  variant = "white",
  id,
}: SectionContainerProps, ref) => {
  return (
    <section 
      id={id}
      ref={ref}
      className={cn(
        "section-shell relative flex flex-col items-center justify-center",
        variant === "alt" && "section-shell--alt",
        className
      )}
    >
      <div className="container-shell w-full">
        {children}
      </div>
    </section>
  );
});

SectionContainer.displayName = "SectionContainer";
