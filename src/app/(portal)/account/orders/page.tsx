import {
  OrderListScene,
  type OrderListBannerState,
  type OrderListEntry,
  type OrderListSection,
} from "@/components/orders/OrderListScene";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import type { PortalOrderListRow } from "@/lib/db/types";
import { listOrdersForPortal } from "@/lib/db/repositories/orders-repository";
import {
  getOrderStagePresentation,
  type PortalOrderEntryAction,
  getPortalOrderBucketFootnote,
  getPortalOrderEntryAction,
  getPortalOrderLifecycleBucket,
  type PortalOrderLifecycleBucket,
} from "@/lib/orders/presentation";

type OrderEntry = {
  order: PortalOrderListRow;
  stage: ReturnType<typeof getOrderStagePresentation>;
  action: PortalOrderEntryAction;
  bucket: PortalOrderLifecycleBucket;
  href: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

function getBannerState(input: {
  activeCount: number;
  needsActionCount: number;
}): OrderListBannerState {
  const { activeCount, needsActionCount } = input;

  if (activeCount === 0) {
    return {
      title: "All caught up",
      detail: "No active orders right now.",
      tone: "idle",
    };
  }

  if (needsActionCount > 0) {
    return {
      title: `${needsActionCount} order${needsActionCount === 1 ? "" : "s"} need action`,
      detail: "Complete required steps first.",
      tone: "action",
    };
  }

  return {
    title: `${activeCount} order${activeCount === 1 ? "" : "s"} in progress`,
    detail: "Track progress or open details.",
    tone: "active",
  };
}

function mapPortalEntryToListSceneEntry(entry: OrderEntry): OrderListEntry {
  return {
    entryId: entry.order.orderId,
    orderNumber: entry.order.orderNumber,
    totalNgn: entry.order.totalNgn,
    placedAt: entry.order.placedAt,
    stageLabel: entry.stage.label,
    stageDetail: entry.stage.detail,
    stageTone: entry.stage.tone,
    footnote: getPortalOrderBucketFootnote(entry.bucket),
    priority: entry.bucket === "action_required",
    href: entry.href,
    actionLabel: entry.action.label,
    actionEmphasis: entry.action.emphasis,
    meta: [
      {
        label: "Placed",
        value: formatDate(entry.order.placedAt),
      },
      {
        label: "Items",
        value: `${entry.order.itemCount} item${entry.order.itemCount === 1 ? "" : "s"}`,
      },
    ],
  };
}

export default async function OrdersPage() {
  const session = await requireAuthenticatedSession("/account/orders");
  const orders = await listOrdersForPortal(session.email);

  const entries = orders.map((order) => {
    const stage = getOrderStagePresentation(order);
    const action = getPortalOrderEntryAction(order);
    const bucket = getPortalOrderLifecycleBucket(order);
    const href =
      action.hrefKind === "track"
        ? `/account/tracking/${order.orderId}`
        : `/account/orders/${order.orderId}`;

    return {
      order,
      stage,
      action,
      bucket,
      href,
    } satisfies OrderEntry;
  });

  const lifecycleRank: Record<PortalOrderLifecycleBucket, number> = {
    action_required: 0,
    in_progress: 1,
    history: 2,
  };

  const sortedEntries = [...entries].sort((left, right) => {
    const rank = lifecycleRank[left.bucket] - lifecycleRank[right.bucket];
    if (rank !== 0) return rank;

    return (
      new Date(right.order.placedAt).getTime() - new Date(left.order.placedAt).getTime()
    );
  });

  const activeEntries = sortedEntries.filter((entry) => entry.bucket !== "history");
  const completedEntries = sortedEntries.filter((entry) => entry.bucket === "history");
  const needsActionCount = entries.filter((entry) => entry.bucket === "action_required").length;

  const bannerState = getBannerState({
    activeCount: activeEntries.length,
    needsActionCount,
  });

  const sections: OrderListSection[] = [
    {
      sectionKey: "in_progress",
      title: "In progress",
      entries: activeEntries.map(mapPortalEntryToListSceneEntry),
    },
    {
      sectionKey: "history",
      title: activeEntries.length === 0 ? "Orders" : "Completed",
      entries: completedEntries.map(mapPortalEntryToListSceneEntry),
    },
  ];

  return (
    <OrderListScene
      banner={bannerState}
      sections={sections}
      emptyStateText="When you place an order, it appears here."
      withBottomPadding
    />
  );
}

