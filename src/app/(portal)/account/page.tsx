import type { ReactNode } from "react";
import Link from "next/link";
import { PortalStoreShelf } from "@/components/account/PortalStoreShelf";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { listPublishedCatalogProducts } from "@/lib/db/repositories/catalog-repository";
import { getPortalAccountSummary } from "@/lib/db/repositories/account-repository";
import { formatFlowStatusLabel } from "@/lib/orders/presentation";

export default async function AccountPage() {
  const session = await requireAuthenticatedSession("/account");
  const [accountSummary, products] = await Promise.all([
    getPortalAccountSummary(session.email),
    listPublishedCatalogProducts(),
  ]);

  const availableProductCount = products.filter((product) => product.isAvailable).length;
  const customerName =
    accountSummary.fullName ?? session.email.split("@")[0] ?? "Customer";
  const hasLatestOrder = Boolean(accountSummary.latestOrderNumber);
  const latestOrderStatusLabel = formatFlowStatusLabel(
    accountSummary.latestOrderStatus ?? "pending"
  );
  const activitySummary = `${accountSummary.activeOrders} active - ${accountSummary.addressCount} places - ${accountSummary.reviewCount} reviews`;
  const completedOrderCount = Math.max(
    0,
    accountSummary.totalOrders - accountSummary.activeOrders
  );

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <section className="space-y-5">
        <div className="w-full rounded-[24px] bg-system-fill/42 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
            <QuickLink href="/account#store" label="Store" />
            <QuickLink href="/account/orders" label="Orders" />
            <QuickLink href="/account/addresses" label="Places" />
            <QuickLink href="/account/profile" label="Profile" />
          </div>
        </div>

        <div className="w-fit rounded-full bg-system-fill/42 px-4 py-2 text-[11px] font-medium tracking-tight text-secondary-label">
          {activitySummary}
        </div>
      </section>

      <section className="space-y-4">
        {hasLatestOrder ? (
          <section className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  {accountSummary.activeOrders > 0 ? "Continue" : "Last order"}
                </div>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-label">
                  #{accountSummary.latestOrderNumber}
                </h2>
                <p className="mt-1 text-sm text-secondary-label">
                  {latestOrderStatusLabel}
                </p>
              </div>
              <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                {accountSummary.activeOrders > 0 ? "Active" : "Completed"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href="/account/orders"
                className="flex min-h-[46px] items-center justify-between gap-3 rounded-[20px] bg-system-fill/42 px-4 py-3 transition-colors duration-200 hover:bg-system-fill/58"
              >
                <span className="text-sm font-semibold text-label">View order</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  Open
                </span>
              </Link>
              {accountSummary.totalOrders > 0 ? (
                <Link
                  href="/account/reorder"
                  className="flex min-h-[46px] items-center justify-between gap-3 rounded-[20px] bg-system-fill/42 px-4 py-3 transition-colors duration-200 hover:bg-system-fill/58"
                >
                  <span className="text-sm font-semibold text-label">Reorder</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    Open
                  </span>
                </Link>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary-label">
              Welcome back
            </div>
            <div className="mt-2 text-lg font-semibold tracking-tight text-label">
              Start your first order.
            </div>
          </section>
        )}
      </section>

      <section id="store" className="scroll-mt-28 space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-label">Shop</h2>
            <p className="mt-1 text-sm text-secondary-label">
              {availableProductCount} available
            </p>
          </div>
        </div>

        <PortalStoreShelf products={products} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <PortalPanel title="Orders" badge={`${accountSummary.totalOrders}`}>
          <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
            <div className="text-sm font-semibold text-label">
              {accountSummary.activeOrders} active
            </div>
            <div className="mt-1 text-xs text-secondary-label">
              {completedOrderCount} completed
            </div>
          </div>
          <Link
            href="/account/orders"
            className="flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/42 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/58"
          >
            <span className="text-sm font-semibold text-label">History</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              Open
            </span>
          </Link>
        </PortalPanel>

        <PortalPanel title="Account" badge={customerName.slice(0, 1).toUpperCase()}>
          <div className="rounded-[24px] bg-system-fill/42 px-4 py-4">
            <div className="text-sm font-semibold text-label">{customerName}</div>
            <div className="mt-1 truncate text-xs text-secondary-label">{session.email}</div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/account/profile"
              className="flex items-center justify-between gap-3 rounded-[20px] bg-system-fill/42 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/58"
            >
              <span className="text-sm font-semibold text-label">Profile</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                Edit
              </span>
            </Link>
            <Link
              href="/account/addresses"
              className="flex items-center justify-between gap-3 rounded-[20px] bg-system-fill/42 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/58"
            >
              <span className="text-sm font-semibold text-label">Places</span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                Open
              </span>
            </Link>
          </div>
          <Link
            href="/account/reviews"
            className="flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/42 px-4 py-4 transition-colors duration-200 hover:bg-system-fill/58"
          >
            <span className="text-sm font-semibold text-label">Reviews</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              Open
            </span>
          </Link>
        </PortalPanel>
      </section>
    </div>
  );
}

function PortalPanel({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <section className="glass-morphism rounded-[32px] bg-[color:var(--surface)]/88 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-label">{title}</h2>
        <span className="rounded-full bg-system-fill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
          {badge}
        </span>
      </div>
      <div className="mt-4 grid gap-3">{children}</div>
    </section>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[40px] items-center justify-center rounded-[18px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-[color:var(--surface)] hover:shadow-soft"
    >
      {label}
    </Link>
  );
}
