import type { ReactNode } from "react";
import { ThreeJSSuppressor } from "@/components/providers/ThreeJSSuppressor";
import { CommerceProvider } from "@/components/providers/CommerceProvider";
import { MarketingContentProvider } from "@/components/providers/MarketingContentProvider";
import { LazyCartDrawer } from "@/components/commerce/LazyCartDrawer";
import { getMarketingSnapshot } from "@/lib/marketing/service";

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const marketingSnapshot = await getMarketingSnapshot();

  return (
    <>
      {process.env.NODE_ENV === "development" ? <ThreeJSSuppressor /> : null}
      <MarketingContentProvider snapshot={marketingSnapshot}>
        <CommerceProvider>
          {children}
          <LazyCartDrawer />
        </CommerceProvider>
      </MarketingContentProvider>
    </>
  );
}
