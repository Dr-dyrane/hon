import type { MarketingBootstrap } from "@/lib/marketing/types";
import { marketingBootstrap as rawBootstrap } from "@/lib/marketing/bootstrap-data.mjs";

export const marketingBootstrap = rawBootstrap as MarketingBootstrap;
