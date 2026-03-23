import Link from "next/link";
import { AdminDeliveryLiveSurface } from "@/components/admin/delivery/AdminDeliveryLiveSurface";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import { buildCourierAccessUrl, createCourierAccessToken } from "@/lib/delivery/access";
import { buildAdminDeliveryLiveSnapshot, getDeliveryLine } from "@/lib/delivery/snapshot";
import { getAdminDeliveryBoardSnapshot } from "@/lib/db/repositories/delivery-repository";
import type { AdminDeliveryOrder, AdminDeliveryRider } from "@/lib/db/types";
import {
  assignRiderAction,
  createRiderAction,
  markReadyAction,
  updateAssignmentStatusAction,
} from "./actions";
import styles from "./delivery-page.module.css";

type DeliveryTone = "idle" | "active" | "overloaded";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const deliveryLabelMap: Record<string, string> = {
  preparing: "Preparing order",
  ready_for_dispatch: "Ready to send",
  out_for_delivery: "Out for delivery",
  assigned: "Rider assigned",
  unassigned: "Awaiting rider",
  picked_up: "Picked up",
  failed: "Delivery failed",
  returned: "Returned",
  delivered: "Delivered",
};

function formatStatusLabel(value: string) {
  return deliveryLabelMap[value] ?? value.replace(/_/g, " ");
}

function resolveTone(input: {
  preparingCount: number;
  readyCount: number;
  liveCount: number;
  failedCount: number;
}) {
  const pressure = input.readyCount + input.liveCount + input.failedCount;

  if (pressure >= 8) {
    return "overloaded" satisfies DeliveryTone;
  }

  if (pressure > 0 || input.preparingCount > 0) {
    return "active" satisfies DeliveryTone;
  }

  return "idle" satisfies DeliveryTone;
}

function getHeroState(input: {
  tone: DeliveryTone;
  preparingCount: number;
  readyCount: number;
  liveCount: number;
  failedCount: number;
}) {
  const { tone, preparingCount, readyCount, liveCount, failedCount } = input;

  if (tone === "overloaded") {
    return {
      title: "Dispatch pressure is high.",
      detail: `${readyCount} ready, ${liveCount} out, and ${failedCount} failed assignment${failedCount === 1 ? "" : "s"}. Clear rider actions first.`,
      primaryActionHref: "#stage-ready",
      primaryActionLabel: "Open dispatch queue",
      pill: "Escalated dispatch",
    };
  }

  if (tone === "active") {
    return {
      title: "Delivery workflow is active.",
      detail: `${preparingCount} preparing, ${readyCount} ready, ${liveCount} out for delivery.`,
      primaryActionHref: readyCount > 0 ? "#stage-ready" : "#stage-live",
      primaryActionLabel: readyCount > 0 ? "Assign riders" : "Monitor live deliveries",
      pill: "Dispatch in motion",
    };
  }

  return {
    title: "Delivery queue is clear.",
    detail: "No preparing, dispatch, or live delivery pressure right now.",
    primaryActionHref: "#rider-roster",
    primaryActionLabel: "Open rider roster",
    pill: "No dispatch queue",
  };
}

function getWorkflowState(input: {
  tone: DeliveryTone;
  preparingCount: number;
  readyCount: number;
  liveCount: number;
}) {
  if (input.tone === "overloaded") {
    return {
      title: "Triage rider assignments now.",
      detail: "Move ready orders to assigned, then stabilize in-transit deliveries.",
      badge: "Overload",
      emptyDetail: "No dispatch tasks right now. Keep rider roster and live map readiness up to date.",
    };
  }

  if (input.tone === "active") {
    return {
      title: "Advance delivery stages.",
      detail: "Mark preparing orders ready, assign riders, and complete delivery transitions.",
      badge: "Active",
      emptyDetail: "No dispatch tasks right now. Keep rider roster and live map readiness up to date.",
    };
  }

  return {
    title: "No delivery queue.",
    detail:
      input.preparingCount + input.readyCount + input.liveCount === 0
        ? "Use this time to maintain rider roster and delivery defaults."
        : "Queue activity is low.",
    badge: "Clear",
    emptyDetail: "No dispatch tasks right now. Keep rider roster and live map readiness up to date.",
  };
}

function StageChip({ value }: { value: string }) {
  return <span className={styles.stageChip}>{formatStatusLabel(value)}</span>;
}

function DeliveryControls({
  order,
  riders,
}: {
  order: AdminDeliveryOrder;
  riders: AdminDeliveryRider[];
}) {
  if (order.deliveryStage === "preparing") {
    return (
      <form action={markReadyAction} className={styles.controlForm}>
        <input type="hidden" name="orderId" value={order.orderId} />
        <button type="submit" className={styles.primaryButton}>
          Ready to send
        </button>
      </form>
    );
  }

  if (order.deliveryStage === "ready_for_dispatch") {
    const canAssign =
      riders.length > 0 &&
      (!order.assignmentStatus ||
        order.assignmentStatus === "unassigned" ||
        order.assignmentStatus === "failed");

    return (
      <div className={styles.controlStack}>
        {canAssign ? (
          <form action={assignRiderAction} className={styles.controlFormWrap}>
            <input type="hidden" name="orderId" value={order.orderId} />
            <select name="riderId" defaultValue={riders[0]?.riderId ?? ""} className={styles.selectInput}>
              {riders.map((rider) => (
                <option key={rider.riderId} value={rider.riderId}>
                  {rider.name}
                </option>
              ))}
            </select>
            <button type="submit" className={styles.primaryButton}>
              Assign rider
            </button>
          </form>
        ) : null}

        {order.assignmentId && order.assignmentStatus === "assigned" ? (
          <div className={styles.controlFormWrap}>
            <form action={updateAssignmentStatusAction} className={styles.controlForm}>
              <input type="hidden" name="orderId" value={order.orderId} />
              <input type="hidden" name="assignmentId" value={order.assignmentId} />
              <input type="hidden" name="nextStatus" value="picked_up" />
              <button type="submit" className={styles.primaryButton}>
                Picked up
              </button>
            </form>
            <form action={updateAssignmentStatusAction} className={styles.controlForm}>
              <input type="hidden" name="orderId" value={order.orderId} />
              <input type="hidden" name="assignmentId" value={order.assignmentId} />
              <input type="hidden" name="nextStatus" value="unassigned" />
              <button type="submit" className={styles.secondaryButton}>
                Remove
              </button>
            </form>
          </div>
        ) : null}

        {order.assignmentId && order.assignmentStatus === "failed" ? (
          <form action={updateAssignmentStatusAction} className={styles.controlForm}>
            <input type="hidden" name="orderId" value={order.orderId} />
            <input type="hidden" name="assignmentId" value={order.assignmentId} />
            <input type="hidden" name="nextStatus" value="returned" />
            <button type="submit" className={styles.secondaryButton}>
              Return
            </button>
          </form>
        ) : null}
      </div>
    );
  }

  if (!order.assignmentId) {
    return null;
  }

  if (order.assignmentStatus === "picked_up") {
    return (
      <div className={styles.controlFormWrap}>
        <form action={updateAssignmentStatusAction} className={styles.controlForm}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <input type="hidden" name="assignmentId" value={order.assignmentId} />
          <input type="hidden" name="nextStatus" value="out_for_delivery" />
          <button type="submit" className={styles.primaryButton}>
            Out for delivery
          </button>
        </form>
        <form action={updateAssignmentStatusAction} className={styles.controlForm}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <input type="hidden" name="assignmentId" value={order.assignmentId} />
          <input type="hidden" name="nextStatus" value="assigned" />
          <button type="submit" className={styles.secondaryButton}>
            Back
          </button>
        </form>
      </div>
    );
  }

  if (order.assignmentStatus === "out_for_delivery") {
    return (
      <div className={styles.controlFormWrap}>
        <form action={updateAssignmentStatusAction} className={styles.controlForm}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <input type="hidden" name="assignmentId" value={order.assignmentId} />
          <input type="hidden" name="nextStatus" value="delivered" />
          <button type="submit" className={styles.primaryButton}>
            Delivered
          </button>
        </form>
        <form action={updateAssignmentStatusAction} className={styles.controlForm}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <input type="hidden" name="assignmentId" value={order.assignmentId} />
          <input type="hidden" name="nextStatus" value="failed" />
          <button type="submit" className={styles.secondaryButton}>
            Failed
          </button>
        </form>
      </div>
    );
  }

  if (order.assignmentStatus === "failed" && riders.length > 0) {
    return (
      <div className={styles.controlStack}>
        <form action={assignRiderAction} className={styles.controlFormWrap}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <select name="riderId" defaultValue={riders[0]?.riderId ?? ""} className={styles.selectInput}>
            {riders.map((rider) => (
              <option key={rider.riderId} value={rider.riderId}>
                {rider.name}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.primaryButton}>
            Reassign rider
          </button>
        </form>

        <form action={updateAssignmentStatusAction} className={styles.controlForm}>
          <input type="hidden" name="orderId" value={order.orderId} />
          <input type="hidden" name="assignmentId" value={order.assignmentId} />
          <input type="hidden" name="nextStatus" value="returned" />
          <button type="submit" className={styles.secondaryButton}>
            Return
          </button>
        </form>
      </div>
    );
  }

  return null;
}

function OrderCard({
  order,
  riders,
}: {
  order: AdminDeliveryOrder;
  riders: AdminDeliveryRider[];
}) {
  const courierUrl =
    order.assignmentId && order.riderId
      ? buildCourierAccessUrl(
          createCourierAccessToken({
            assignmentId: order.assignmentId,
            orderId: order.orderId,
            riderId: order.riderId,
          })
        )
      : null;

  return (
    <article className={styles.orderCard}>
      <div className={styles.orderHead}>
        <div className={styles.orderMain}>
          <p className={styles.orderEyebrow}>#{order.orderNumber}</p>
          <p className={styles.orderCustomer}>{order.customerName}</p>
        </div>

        <div className={styles.orderChipRow}>
          <StageChip value={order.deliveryStage} />
          {order.assignmentStatus ? <StageChip value={order.assignmentStatus} /> : null}
        </div>
      </div>

      <div className={styles.orderAddressBlock}>
        <p>{getDeliveryLine(order.deliveryAddressSnapshot)}</p>
        <p>{order.customerPhone}</p>
        {order.riderName ? (
          <p className={styles.orderRider}>
            {order.riderName}
            {order.riderPhone ? ` / ${order.riderPhone}` : ""}
          </p>
        ) : null}
      </div>

      <div className={styles.orderMetaGrid}>
        <div className={styles.metaStat}>
          <p className={styles.metaValue}>{formatNgn(order.totalNgn)}</p>
          <p className={styles.metaLabel}>
            {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className={styles.metaStat}>
          <p className={styles.metaValue}>{order.transferReference}</p>
          <p className={styles.metaLabel}>{formatTimestamp(order.placedAt)}</p>
        </div>

        <div className={styles.metaLinkStack}>
          <Link href={`/admin/orders/${order.orderId}`} className={styles.metaLink}>
            Open order
          </Link>
          {courierUrl ? (
            <Link href={courierUrl} target="_blank" rel="noreferrer" className={styles.metaLink}>
              Courier
            </Link>
          ) : null}
        </div>
      </div>

      {order.latestDeliveryEventType ? (
        <p className={styles.eventLabel}>
          {formatStatusLabel(order.latestDeliveryEventType)} / {formatTimestamp(order.latestDeliveryEventAt)}
        </p>
      ) : null}

      <div className={styles.controlsWrap}>
        <DeliveryControls order={order} riders={riders} />
      </div>
    </article>
  );
}

function StageCard({
  title,
  count,
  orders,
  riders,
  sectionId,
}: {
  title: string;
  count: number;
  orders: AdminDeliveryOrder[];
  riders: AdminDeliveryRider[];
  sectionId: string;
}) {
  return (
    <section id={sectionId} className={styles.stageCard}>
      <div className={styles.stageHead}>
        <h3 className={styles.stageTitle}>{title}</h3>
        <span className={styles.stageCount}>{count}</span>
      </div>

      {orders.length === 0 ? (
        <div className={styles.emptyStage}>Clear</div>
      ) : (
        <div className={styles.orderStack}>
          {orders.map((order) => (
            <OrderCard key={order.orderId} order={order} riders={riders} />
          ))}
        </div>
      )}
    </section>
  );
}

function RiderRoster({ riders }: { riders: AdminDeliveryRider[] }) {
  return (
    <section id="rider-roster" className={styles.rosterCard}>
      <div className={styles.stageHead}>
        <h3 className={styles.stageTitle}>Riders</h3>
        <span className={styles.stageCount}>{riders.length}</span>
      </div>

      <form id="admin-delivery-rider-form" action={createRiderAction} className={styles.riderForm}>
        <input type="text" name="name" placeholder="Rider name" className={styles.riderInput} />
        <input type="tel" name="phoneNumber" placeholder="Phone" className={styles.riderInput} />
        <input type="text" name="vehicleType" placeholder="Bike or car" className={styles.riderInput} />
        <button type="submit" className={styles.primaryButton}>
          Save rider
        </button>
      </form>

      <div className={styles.riderStack}>
        {riders.map((rider) => (
          <article key={rider.riderId} className={styles.riderCard}>
            <div className={styles.riderHead}>
              <div>
                <p className={styles.riderName}>{rider.name}</p>
                <p className={styles.riderDetail}>{rider.phone}</p>
                {rider.vehicleType ? <p className={styles.riderDetail}>{rider.vehicleType}</p> : null}
              </div>

              <div className={styles.riderStatusCol}>
                <span className={styles.stageChip}>
                  {rider.activeAssignmentCount === 0 ? "Free" : "Busy"}
                </span>
                {rider.activeOrderNumber ? (
                  <p className={styles.riderOrder}>#{rider.activeOrderNumber}</p>
                ) : null}
              </div>
            </div>
          </article>
        ))}

        {riders.length === 0 ? <div className={styles.emptyStage}>No riders yet.</div> : null}
      </div>
    </section>
  );
}

function WorkflowAction({
  href,
  label,
  detail,
  value,
  meta,
}: {
  href: string;
  label: string;
  detail: string;
  value: string;
  meta: string;
}) {
  return (
    <Link href={href} className={styles.workflowAction}>
      <div className={styles.workflowActionMain}>
        <p className={styles.workflowActionLabel}>{label}</p>
        <p className={styles.workflowActionDetail}>{detail}</p>
      </div>
      <div className={styles.workflowActionSide}>
        <span className={styles.workflowActionValue}>{value}</span>
        <span className={styles.workflowActionMeta}>{meta}</span>
      </div>
    </Link>
  );
}

export default async function AdminDeliveryPage() {
  const session = await requireAdminSession("/admin/delivery");
  const { orders, riders, trackingEnabled } = await getAdminDeliveryBoardSnapshot({
    actorEmail: session.email,
  });

  const preparingOrders = orders.filter((order) => order.deliveryStage === "preparing");
  const readyOrders = orders.filter((order) => order.deliveryStage === "ready_for_dispatch");
  const liveOrders = orders.filter((order) => order.deliveryStage === "out_for_delivery");
  const failedAssignments = orders.filter((order) => order.assignmentStatus === "failed").length;

  const tone = resolveTone({
    preparingCount: preparingOrders.length,
    readyCount: readyOrders.length,
    liveCount: liveOrders.length,
    failedCount: failedAssignments,
  });
  const heroState = getHeroState({
    tone,
    preparingCount: preparingOrders.length,
    readyCount: readyOrders.length,
    liveCount: liveOrders.length,
    failedCount: failedAssignments,
  });
  const workflowState = getWorkflowState({
    tone,
    preparingCount: preparingOrders.length,
    readyCount: readyOrders.length,
    liveCount: liveOrders.length,
  });

  const queueSummary = `${preparingOrders.length} preparing - ${readyOrders.length} ready - ${liveOrders.length} out`;

  const liveSnapshot = await buildAdminDeliveryLiveSnapshot({
    orders,
    riders,
    trackingEnabled,
  });

  return (
    <div className={styles.page}>
      <section
        className={`${styles.hero} ${tone === "overloaded" ? styles.heroOverloaded : tone === "active" ? styles.heroActive : styles.heroIdle}`}
      >
        <p className={styles.heroEyebrow}>Delivery overview</p>
        <h1 className={styles.heroTitle}>{heroState.title}</h1>
        <p className={styles.heroDetail}>{heroState.detail}</p>

        <div className={styles.heroActions}>
          <Link href={heroState.primaryActionHref} className={styles.primaryLink}>
            {heroState.primaryActionLabel}
          </Link>
          <Link href="#delivery-live" className={styles.secondaryLink}>
            Open live map
          </Link>
        </div>

        <div className={styles.activityPill}>{tone === "idle" ? heroState.pill : queueSummary}</div>
      </section>

      <section
        className={`${styles.primaryWorkflow} ${tone === "overloaded" ? styles.workflowOverloaded : tone === "active" ? styles.workflowActive : styles.workflowIdle}`}
      >
        <div className={styles.workflowHead}>
          <div>
            <p className={styles.panelEyebrow}>Primary workflow</p>
            <h2 className={styles.workflowTitle}>{workflowState.title}</h2>
            <p className={styles.workflowDetail}>{workflowState.detail}</p>
          </div>
          <span className={styles.workflowBadge}>{workflowState.badge}</span>
        </div>

        <div className={styles.workflowActionGrid}>
          <WorkflowAction
            href="#stage-preparing"
            label="Preparing"
            detail="Ready for quality checks"
            value={`${preparingOrders.length}`}
            meta="Open"
          />
          <WorkflowAction
            href="#stage-ready"
            label="Ready"
            detail="Awaiting rider assignment"
            value={`${readyOrders.length}`}
            meta="Assign"
          />
          <WorkflowAction
            href="#stage-live"
            label="Out"
            detail="In active delivery"
            value={`${liveOrders.length}`}
            meta="Track"
          />
        </div>
      </section>

      <section className={styles.boardGrid}>
        <div className={styles.stageGrid}>
          <StageCard
            sectionId="stage-preparing"
            title="Preparing"
            count={preparingOrders.length}
            orders={preparingOrders}
            riders={riders}
          />
          <StageCard
            sectionId="stage-ready"
            title="Ready to Send"
            count={readyOrders.length}
            orders={readyOrders}
            riders={riders}
          />
          <StageCard
            sectionId="stage-live"
            title="Out for Delivery"
            count={liveOrders.length}
            orders={liveOrders}
            riders={riders}
          />
        </div>

        <div className={styles.sideGrid}>
          <section id="delivery-live" className={styles.liveSurfaceShell}>
            <AdminDeliveryLiveSurface
              initialSnapshot={liveSnapshot}
              fallbackUrl="/api/admin/delivery/live"
              streamUrl="/api/admin/delivery/live/stream"
            />
          </section>

          <RiderRoster riders={riders} />
        </div>
      </section>
    </div>
  );
}
