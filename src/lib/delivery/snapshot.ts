import type { AdminDeliveryOrder, AdminDeliveryRider } from "@/lib/db/types";
import { buildTrackingMapUrl, getTrackingCoords as getSnapshotTrackingCoords } from "@/lib/delivery/tracking";

export type AdminDeliveryLiveSnapshot = {
  trackingEnabled: boolean;
  preparingCount: number;
  readyCount: number;
  liveCount: number;
  riderCount: number;
  busyRiderCount: number;
  mapOrder: {
    orderId: string;
    orderNumber: string;
    addressLine: string;
    mapUrl: string | null;
    trackedAt: string | null;
  } | null;
};

export function getDeliveryLine(snapshot: Record<string, unknown>) {
  const candidates = ["formatted", "line1", "label"];

  for (const key of candidates) {
    const value = snapshot[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "Pending";
}

export function getOrderTrackingCoords(order: AdminDeliveryOrder) {
  if (
    typeof order.latestTrackingLatitude === "number" &&
    typeof order.latestTrackingLongitude === "number"
  ) {
    return {
      lat: order.latestTrackingLatitude,
      lng: order.latestTrackingLongitude,
    };
  }

  return getSnapshotTrackingCoords(order.deliveryAddressSnapshot);
}

export function buildAdminDeliveryLiveSnapshot(input: {
  orders: AdminDeliveryOrder[];
  riders: AdminDeliveryRider[];
  trackingEnabled?: boolean;
}): AdminDeliveryLiveSnapshot {
  const preparingOrders = input.orders.filter((order) => order.deliveryStage === "preparing");
  const readyOrders = input.orders.filter(
    (order) => order.deliveryStage === "ready_for_dispatch"
  );
  const liveOrders = input.orders.filter(
    (order) => order.deliveryStage === "out_for_delivery"
  );
  const mapOrder =
    [...liveOrders, ...readyOrders, ...preparingOrders].find((order) =>
      Boolean(getOrderTrackingCoords(order))
    ) ?? null;
  const mapCoords = mapOrder ? getOrderTrackingCoords(mapOrder) : null;

  return {
    trackingEnabled: input.trackingEnabled ?? true,
    preparingCount: preparingOrders.length,
    readyCount: readyOrders.length,
    liveCount: liveOrders.length,
    riderCount: input.riders.length,
    busyRiderCount: input.riders.filter((rider) => rider.activeAssignmentCount > 0).length,
    mapOrder: mapOrder && (input.trackingEnabled ?? true)
      ? {
          orderId: mapOrder.orderId,
          orderNumber: mapOrder.orderNumber,
          addressLine: getDeliveryLine(mapOrder.deliveryAddressSnapshot),
          mapUrl: mapCoords
            ? buildTrackingMapUrl({
                latitude: mapCoords.lat,
                longitude: mapCoords.lng,
                width: 1000,
                height: 720,
                zoom: mapOrder.latestTrackingRecordedAt ? 14 : 12,
              })
            : null,
          trackedAt: mapOrder.latestTrackingRecordedAt,
        }
      : null,
  };
}
