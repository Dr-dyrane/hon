import type { ReactNode } from "react";
import { AOSProvider } from "@/components/providers/AOSProvider";
import { ThreeJSSuppressor } from "@/components/providers/ThreeJSSuppressor";
import { CommerceProvider } from "@/components/providers/CommerceProvider";
import { MarketingContentProvider } from "@/components/providers/MarketingContentProvider";
import { CartDrawer } from "@/components/commerce/CartDrawer";
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
      <AOSProvider>
        <MarketingContentProvider snapshot={marketingSnapshot}>
          <CommerceProvider>
            {children}
            <CartDrawer />
          </CommerceProvider>
        </MarketingContentProvider>
      </AOSProvider>
    </>
  );
}
