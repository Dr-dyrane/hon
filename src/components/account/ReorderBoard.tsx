"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { PortalOrderListRow } from "@/lib/db/types";
import { prepareReorderAction } from "@/app/(portal)/account/reorder/actions";
import { useUI } from "@/components/providers/UIProvider";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import { replaceRemoteCartItems } from "@/lib/cart/api-client";
import { dispatchCommerceCartSync, dispatchCommerceOpenCart } from "@/lib/cart/events";
import { formatNgn } from "@/lib/commerce";
import { formatFlowStatusLabel } from "@/lib/orders/presentation";
import {
  buildReorderSuccessMessage,
  REORDER_EMPTY_MESSAGE,
  REORDER_ERROR_MESSAGE,
} from "@/lib/orders/reorder";
import { cn } from "@/lib/utils";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatStatusLabel(value: string) {
  return formatFlowStatusLabel(value);
}

type MessageTone = "success" | "error" | null;

export function ReorderBoard({ orders }: { orders: PortalOrderListRow[] }) {
  const { hasActiveOverlay } = useUI();
  const feedback = useFeedback();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (left, right) =>
          new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime()
      ),
    [orders]
  );

  const readyOrders = sortedOrders.filter((order) => !order.active);
  const activeOrders = sortedOrders.filter((order) => order.active);

  function openCart() {
    feedback.selection();
    dispatchCommerceOpenCart();
  }

  function handleReorder(orderId: string) {
    feedback.selection();
    setBusyOrderId(orderId);
    setMessage(null);
    setMessageTone(null);

    startTransition(async () => {
      const prepared = await prepareReorderAction(orderId);

      if (!prepared.success || !prepared.data) {
        feedback.blocked();
        setMessage(prepared.error || REORDER_ERROR_MESSAGE);
        setMessageTone("error");
        setBusyOrderId(null);
        return;
      }

      if (prepared.data.items.length === 0) {
        feedback.blocked();
        setMessage(REORDER_EMPTY_MESSAGE);
        setMessageTone("error");
        setBusyOrderId(null);
        return;
      }

      try {
        const snapshot = await replaceRemoteCartItems(prepared.data.items);
        dispatchCommerceCartSync(snapshot.items);
      } catch (error) {
        feedback.blocked();
        setMessage((error as Error).message || REORDER_ERROR_MESSAGE);
        setMessageTone("error");
        setBusyOrderId(null);
        return;
      }

      setMessage(
        buildReorderSuccessMessage({
          unavailableCount: prepared.data.unavailableItems.length,
          changedPriceCount: prepared.data.changedPriceCount,
        })
      );
      setMessageTone("success");
      setBusyOrderId(null);
      feedback.success();
      dispatchCommerceOpenCart();
    });
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-[28px] bg-[color:var(--surface)]/86 px-5 py-6 text-sm text-secondary-label shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        No orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {readyOrders.length > 0 ? (
        <OrderGroup
          title="Ready"
          orders={readyOrders}
          isPending={isPending}
          busyOrderId={busyOrderId}
          onReorder={handleReorder}
        />
      ) : null}

      {activeOrders.length > 0 ? (
        <OrderGroup
          title="In progress"
          orders={activeOrders}
          isPending={isPending}
          busyOrderId={busyOrderId}
          onReorder={handleReorder}
        />
      ) : null}

      <div
        className={cn(
          "z-layer-sticky-action sticky bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] transition-all duration-200 md:bottom-6",
          hasActiveOverlay && "pointer-events-none translate-y-4 opacity-0"
        )}
      >
        <div className="flex items-center justify-between gap-3 rounded-[24px] bg-system-fill/56 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <p
            className={cn(
              "text-xs font-medium",
              messageTone === "success" && "text-accent",
              messageTone === "error" && "text-red-500",
              !messageTone && "text-secondary-label"
            )}
          >
            {message ?? "Reorder updates cart with available items."}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCart}
              className="button-primary min-h-[40px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em]"
            >
              Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderGroup({
  title,
  orders,
  isPending,
  busyOrderId,
  onReorder,
}: {
  title: string;
  orders: PortalOrderListRow[];
  isPending: boolean;
  busyOrderId: string | null;
  onReorder: (orderId: string) => void;
}) {
  return (
    <section className="space-y-2">
      <header className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary-label">
          {title}
        </h2>
        <span className="rounded-full bg-system-fill/42 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
          {orders.length}
        </span>
      </header>

      <div className="space-y-3">
        {orders.map((order) => (
          <article
            key={order.orderId}
            className="rounded-[28px] bg-[color:var(--surface)]/86 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
          >
            <div className="flex flex-col gap-4 min-[920px]:flex-row min-[920px]:items-center min-[920px]:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold tracking-tight text-label">
                    #{order.orderNumber}
                  </h3>
                  <span className="rounded-full bg-system-fill/42 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                    {formatStatusLabel(order.status)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-secondary-label">
                  <span>{formatTimestamp(order.placedAt)}</span>
                  <span>{order.itemCount} items</span>
                  <span>{formatNgn(order.totalNgn)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/account/orders/${order.orderId}`}
                  className="flex min-h-[40px] items-center rounded-[18px] bg-system-fill/42 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label"
                >
                  Open order
                </Link>
                <button
                  type="button"
                  onClick={() => onReorder(order.orderId)}
                  disabled={isPending && busyOrderId === order.orderId}
                  className={cn(
                    "button-primary min-h-[40px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em]",
                    isPending && busyOrderId === order.orderId && "pointer-events-none opacity-50"
                  )}
                >
                  {isPending && busyOrderId === order.orderId ? "Preparing" : "Reorder"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
