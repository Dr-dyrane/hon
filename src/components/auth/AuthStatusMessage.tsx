"use client";

import type { ReactNode } from "react";
import { ActionStatusMessage } from "@/components/ui/ActionStatusMessage";

export function AuthStatusMessage({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  return <ActionStatusMessage tone={tone}>{children}</ActionStatusMessage>;
}
