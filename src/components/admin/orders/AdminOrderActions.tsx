"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import type {
  AdminDeliveryRider,
  AdminOrderDeliveryWorkflow,
  AdminOrderInventoryReadiness,
} from "@/lib/db/types";
import {
  acceptOrderRequestAction,
  assignOrderRiderAction,
  cancelOrderAction,
  markReadyForDispatchAction,
  reviewPaymentAction,
  updateOrderAssignmentStatusAction,
} from "@/app/(admin)/admin/orders/[orderId]/actions";
import { RouteFeedbackLink } from "@/components/ui/RouteFeedbackLink";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import { INITIAL_ORDER_ADMIN_ACTION_STATE } from "@/lib/orders/action-state";
import { getPaymentReviewActionLabel } from "@/lib/orders/presentation";
import { cn } from "@/lib/utils";

const PANEL_CLASS = "rounded-[28px] bg-system-fill/38 p-4 shadow-soft md:p-5";
const SOFT_PANEL_CLASS = "rounded-[28px] bg-system-fill/28 p-4 shadow-soft md:p-5";
const PRIMARY_BUTTON_CLASS =
  "button-secondary min-h-[46px] w-full text-xs font-semibold uppercase tracking-headline disabled:translate-y-0 disabled:shadow-none disabled:opacity-50";
const SECONDARY_BUTTON_CLASS =
  "min-h-[46px] w-full rounded-full bg-system-fill/56 px-4 text-xs font-semibold uppercase tracking-headline text-label transition-colors duration-200 hover:bg-system-fill/76 disabled:opacity-50";
const DANGER_BUTTON_CLASS =
  "min-h-[46px] w-full rounded-full bg-system-fill/56 px-4 text-xs font-semibold uppercase tracking-headline text-red-500 transition-colors duration-200 hover:bg-system-fill/76 disabled:opacity-50";
const SELECT_CLASS =
  "min-h-[46px] rounded-[22px] bg-system-fill/52 px-4 text-sm text-label focus:outline-none";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatusLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getDeliveryStageLabel(value: AdminOrderDeliveryWorkflow["deliveryStage"]) {
  switch (value) {
    case "not_ready":
      return "Payment gate";
    case "preparing":
      return "Preparing";
    case "ready_for_dispatch":
      return "Ready to send";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return "Delivered";
    case "closed":
      return "Closed";
    default:
      return "Delivery";
  }
}

function getDeliveryBoardHref(workflow: AdminOrderDeliveryWorkflow | null | undefined) {
  if (!workflow) {
    return "/admin/delivery";
  }

  if (workflow.deliveryStage === "preparing") {
    return "/admin/delivery#stage-preparing";
  }

  if (workflow.deliveryStage === "ready_for_dispatch") {
    return "/admin/delivery#stage-ready";
  }

  if (workflow.deliveryStage === "out_for_delivery") {
    return "/admin/delivery#stage-live";
  }

  return "/admin/delivery";
}

function getWorkflowCopy(input: {
  isRequestPending: boolean;
  paymentActions: readonly string[];
  requestReadiness?: AdminOrderInventoryReadiness | null;
  deliveryWorkflow?: AdminOrderDeliveryWorkflow | null;
}) {
  const { isRequestPending, paymentActions, requestReadiness, deliveryWorkflow } = input;

  if (isRequestPending) {
    return {
      title: requestReadiness?.canAccept === false ? "Request blocked" : "Accept request",
      detail:
        requestReadiness?.summary ??
        "Reserve inventory, confirm availability, and open the transfer window.",
      badge: requestReadiness?.canAccept === false ? "Blocked" : "Request",
    };
  }

  if (paymentActions.length > 0) {
    return {
      title:
        paymentActions[0] === "under_review" ? "Check payment proof" : "Resolve payment",
      detail: "Confirm the transfer before prep and dispatch continue.",
      badge: "Payment",
    };
  }

  if (!deliveryWorkflow || deliveryWorkflow.deliveryStage === "not_ready") {
    return {
      title: "Waiting for customer transfer",
      detail: "No admin action is available until payment is submitted or the order is cancelled.",
      badge: "Waiting",
    };
  }

  if (deliveryWorkflow.deliveryStage === "preparing") {
    return {
      title: "Move into dispatch",
      detail: "Mark the order ready once picking and packing are complete.",
      badge: "Dispatch",
    };
  }

  if (deliveryWorkflow.deliveryStage === "ready_for_dispatch") {
    if (deliveryWorkflow.assignmentStatus === "assigned") {
      return {
        title: "Confirm rider pickup",
        detail: "Lock the handoff before the order moves into live delivery.",
        badge: "Handoff",
      };
    }

    if (deliveryWorkflow.assignmentStatus === "failed") {
      return {
        title: "Recover dispatch",
        detail: "Reassign a rider or return the order to the ready queue.",
        badge: "Recovery",
      };
    }

    return {
      title: "Assign a rider",
      detail: "The order is ready. Attach a rider to move it into dispatch.",
      badge: "Dispatch",
    };
  }

  if (deliveryWorkflow.deliveryStage === "out_for_delivery") {
    if (deliveryWorkflow.assignmentStatus === "picked_up") {
      return {
        title: "Start live delivery",
        detail: "Move from pickup into in-transit tracking once the rider leaves.",
        badge: "Transit",
      };
    }

    if (deliveryWorkflow.assignmentStatus === "failed") {
      return {
        title: "Recover failed delivery",
        detail: "Reassign the order or return it to the dispatch queue.",
        badge: "Recovery",
      };
    }

    return {
      title: "Close the delivery",
      detail: "Mark delivered when handoff is complete, or log a failed attempt.",
      badge: "Transit",
    };
  }

  if (deliveryWorkflow.deliveryStage === "delivered") {
    return {
      title: "Order delivered",
      detail: "Payment and delivery are complete. Return and refund follow-through stays below.",
      badge: "Delivered",
    };
  }

  return {
    title: "Order closed",
    detail: "This order is no longer actionable from the admin workflow.",
    badge: "Closed",
  };
}

function canAssignRider(workflow?: AdminOrderDeliveryWorkflow | null) {
  if (!workflow) {
    return false;
  }

  return ["ready_for_dispatch", "out_for_delivery"].includes(workflow.deliveryStage) &&
    [null, "unassigned", "returned", "failed"].includes(workflow.assignmentStatus);
}

function showMarkReady(workflow?: AdminOrderDeliveryWorkflow | null) {
  return workflow?.deliveryStage === "preparing";
}

function showDeliveryContext(workflow?: AdminOrderDeliveryWorkflow | null) {
  return Boolean(workflow && workflow.deliveryStage !== "not_ready");
}

export function AdminOrderActions({
  orderId,
  paymentId,
  isRequestPending,
  requestReadiness,
  paymentActions,
  deliveryWorkflow,
  riders,
  canCancel,
}: {
  orderId: string;
  paymentId: string | null;
  isRequestPending: boolean;
  requestReadiness?: AdminOrderInventoryReadiness | null;
  paymentActions: readonly string[];
  deliveryWorkflow?: AdminOrderDeliveryWorkflow | null;
  riders: AdminDeliveryRider[];
  canCancel: boolean;
}) {
  const router = useRouter();
  const feedback = useFeedback();
  const [acceptState, acceptFormAction, acceptPending] = useActionState(
    acceptOrderRequestAction,
    INITIAL_ORDER_ADMIN_ACTION_STATE
  );
  const workflowCopy = getWorkflowCopy({
    isRequestPending,
    paymentActions,
    requestReadiness,
    deliveryWorkflow,
  });
  const needsRiderAssignment = canAssignRider(deliveryWorkflow);
  const hasRiders = riders.length > 0;

  useEffect(() => {
    if (acceptState.status === "success") {
      feedback.success();
      router.refresh();
      return;
    }

    if (acceptState.status === "error") {
      feedback.blocked();
    }
  }, [acceptState.status, feedback, router]);

  return (
    <div className="grid gap-3">
      <section className={PANEL_CLASS}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
              Current workflow
            </p>
            <h2 className="mt-1 text-base font-semibold text-label md:text-lg">
              {workflowCopy.title}
            </h2>
            <p className="mt-1 max-w-[42rem] text-sm leading-6 text-secondary-label">
              {workflowCopy.detail}
            </p>
          </div>
          <span className="rounded-full bg-system-fill/52 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
            {workflowCopy.badge}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {isRequestPending ? (
            <>
              <form
                id="admin-order-primary-form"
                action={acceptFormAction}
                className="flex"
                onSubmitCapture={() => feedback.selection()}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="note" value="Request accepted from order detail." />
                <ActionSubmitButton
                  className={PRIMARY_BUTTON_CLASS}
                  pendingLabel="Checking stock"
                  disabled={acceptPending || requestReadiness?.canAccept === false}
                >
                  {requestReadiness?.canAccept === false ? "Needs stock" : "Accept"}
                </ActionSubmitButton>
              </form>

              <form action={cancelOrderAction} className="flex" onSubmitCapture={() => feedback.tap()}>
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="note" value="Request declined from order detail." />
                <ActionSubmitButton className={DANGER_BUTTON_CLASS} pendingLabel="Declining">
                  Decline
                </ActionSubmitButton>
              </form>
            </>
          ) : paymentId && paymentActions.length > 0 ? (
            <>
              {paymentActions.map((action, index) => (
                <form
                  key={action}
                  id={index === 0 ? "admin-order-primary-form" : undefined}
                  action={reviewPaymentAction}
                  className="flex"
                  onSubmitCapture={() => feedback.selection()}
                >
                  <input type="hidden" name="orderId" value={orderId} />
                  <input type="hidden" name="paymentId" value={paymentId} />
                  <ActionSubmitButton
                    className={cn(
                      action === "confirmed" ? PRIMARY_BUTTON_CLASS : SECONDARY_BUTTON_CLASS
                    )}
                    pendingLabel="Saving"
                    name="action"
                    value={action}
                  >
                    {getPaymentReviewActionLabel(action)}
                  </ActionSubmitButton>
                </form>
              ))}
            </>
          ) : showMarkReady(deliveryWorkflow) ? (
            <form
              id="admin-order-primary-form"
              action={markReadyForDispatchAction}
              className="flex"
              onSubmitCapture={() => feedback.selection()}
            >
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="note" value="Marked ready from order detail." />
              <ActionSubmitButton className={PRIMARY_BUTTON_CLASS} pendingLabel="Updating">
                Ready to send
              </ActionSubmitButton>
            </form>
          ) : needsRiderAssignment ? (
            hasRiders ? (
              <>
                <form
                  id="admin-order-primary-form"
                  action={assignOrderRiderAction}
                  className="grid gap-2 sm:col-span-2 xl:col-span-2"
                  onSubmitCapture={() => feedback.selection()}
                >
                  <input type="hidden" name="orderId" value={orderId} />
                  <input
                    type="hidden"
                    name="note"
                    value={
                      deliveryWorkflow?.assignmentStatus === "failed"
                        ? "Rider reassigned from order detail."
                        : "Rider assigned from order detail."
                    }
                  />
                  <select
                    name="riderId"
                    defaultValue={riders[0]?.riderId ?? ""}
                    className={SELECT_CLASS}
                  >
                    {riders.map((rider) => (
                      <option key={rider.riderId} value={rider.riderId}>
                        {rider.name}
                      </option>
                    ))}
                  </select>
                  <ActionSubmitButton className={PRIMARY_BUTTON_CLASS} pendingLabel="Assigning">
                    {deliveryWorkflow?.assignmentStatus === "failed"
                      ? "Reassign rider"
                      : "Assign rider"}
                  </ActionSubmitButton>
                </form>

                {deliveryWorkflow?.assignmentId &&
                deliveryWorkflow.assignmentStatus === "failed" ? (
                  <form
                    action={updateOrderAssignmentStatusAction}
                    className="flex"
                    onSubmitCapture={() => feedback.tap()}
                  >
                    <input type="hidden" name="orderId" value={orderId} />
                    <input
                      type="hidden"
                      name="assignmentId"
                      value={deliveryWorkflow.assignmentId}
                    />
                    <input type="hidden" name="nextStatus" value="returned" />
                    <input type="hidden" name="note" value="Returned to dispatch queue from order detail." />
                    <ActionSubmitButton className={SECONDARY_BUTTON_CLASS} pendingLabel="Returning">
                      Return to queue
                    </ActionSubmitButton>
                  </form>
                ) : null}
              </>
            ) : (
              <div className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label sm:col-span-2 xl:col-span-2">
                Add a rider before this order can leave the dispatch queue.
              </div>
            )
          ) : deliveryWorkflow?.assignmentId &&
            deliveryWorkflow.assignmentStatus === "assigned" ? (
            <>
              <form
                id="admin-order-primary-form"
                action={updateOrderAssignmentStatusAction}
                className="flex"
                onSubmitCapture={() => feedback.selection()}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="picked_up" />
                <input type="hidden" name="note" value="Pickup confirmed from order detail." />
                <ActionSubmitButton className={PRIMARY_BUTTON_CLASS} pendingLabel="Saving">
                  Picked up
                </ActionSubmitButton>
              </form>

              <form
                action={updateOrderAssignmentStatusAction}
                className="flex"
                onSubmitCapture={() => feedback.tap()}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="unassigned" />
                <input type="hidden" name="note" value="Rider removed from order detail." />
                <ActionSubmitButton className={SECONDARY_BUTTON_CLASS} pendingLabel="Removing">
                  Remove rider
                </ActionSubmitButton>
              </form>
            </>
          ) : deliveryWorkflow?.assignmentId &&
            deliveryWorkflow.assignmentStatus === "picked_up" ? (
            <>
              <form
                id="admin-order-primary-form"
                action={updateOrderAssignmentStatusAction}
                className="flex"
                onSubmitCapture={() => feedback.selection()}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="out_for_delivery" />
                <input type="hidden" name="note" value="Delivery started from order detail." />
                <ActionSubmitButton className={PRIMARY_BUTTON_CLASS} pendingLabel="Starting">
                  Out for delivery
                </ActionSubmitButton>
              </form>

              <form
                action={updateOrderAssignmentStatusAction}
                className="flex"
                onSubmitCapture={() => feedback.tap()}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="assigned" />
                <input type="hidden" name="note" value="Pickup reverted from order detail." />
                <ActionSubmitButton className={SECONDARY_BUTTON_CLASS} pendingLabel="Reverting">
                  Back to assigned
                </ActionSubmitButton>
              </form>
            </>
          ) : deliveryWorkflow?.assignmentId &&
            deliveryWorkflow.assignmentStatus === "out_for_delivery" ? (
            <>
              <form
                id="admin-order-primary-form"
                action={updateOrderAssignmentStatusAction}
                className="flex"
                onSubmitCapture={() => feedback.selection()}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="delivered" />
                <input type="hidden" name="note" value="Delivered from order detail." />
                <ActionSubmitButton className={PRIMARY_BUTTON_CLASS} pendingLabel="Closing">
                  Delivered
                </ActionSubmitButton>
              </form>

              <form
                action={updateOrderAssignmentStatusAction}
                className="flex"
                onSubmitCapture={() => feedback.tap()}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="failed" />
                <input type="hidden" name="note" value="Delivery failed from order detail." />
                <ActionSubmitButton className={SECONDARY_BUTTON_CLASS} pendingLabel="Saving">
                  Failed delivery
                </ActionSubmitButton>
              </form>
            </>
          ) : (
            <div className="rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm text-secondary-label sm:col-span-2 xl:col-span-2">
              {deliveryWorkflow?.deliveryStage === "delivered"
                ? "Delivery is complete. Use the return workflow below if follow-through is needed."
                : deliveryWorkflow?.deliveryStage === "closed"
                  ? "Order is closed. No further operational actions are available."
                  : paymentId
                    ? "No payment action needed."
                    : "Waiting for payment."}
            </div>
          )}

          {!isRequestPending && canCancel ? (
            <form action={cancelOrderAction} className="flex" onSubmitCapture={() => feedback.tap()}>
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="note" value="Cancelled from order detail." />
              <ActionSubmitButton className={DANGER_BUTTON_CLASS} pendingLabel="Cancelling">
                Cancel order
              </ActionSubmitButton>
            </form>
          ) : null}

          {!isRequestPending && needsRiderAssignment && !hasRiders ? (
            <RouteFeedbackLink
              href="/admin/delivery#rider-roster"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-system-fill/56 px-4 text-xs font-semibold uppercase tracking-headline text-label transition-colors duration-200 hover:bg-system-fill/76 sm:col-span-2 xl:col-span-1"
            >
              Open rider roster
            </RouteFeedbackLink>
          ) : null}
        </div>

        {acceptState.message ? (
          <div
            className={cn(
              "mt-3 rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm",
              acceptState.status === "error" ? "text-red-500" : "text-secondary-label"
            )}
          >
            {acceptState.message}
          </div>
        ) : requestReadiness ? (
          <div
            className={cn(
              "mt-3 rounded-[24px] bg-system-fill/42 px-4 py-4 text-sm",
              requestReadiness.canAccept
                ? requestReadiness.hasLowStock
                  ? "text-label"
                  : "text-secondary-label"
                : "text-red-500"
            )}
          >
            {requestReadiness.summary}
          </div>
        ) : null}
      </section>

      {showDeliveryContext(deliveryWorkflow) ? (
        <section className={SOFT_PANEL_CLASS}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                Dispatch context
              </p>
              <h3 className="mt-1 text-base font-semibold text-label">
                {getDeliveryStageLabel(deliveryWorkflow?.deliveryStage ?? "not_ready")}
              </h3>
              <p className="mt-1 text-sm text-secondary-label">
                {deliveryWorkflow?.riderName
                  ? `${deliveryWorkflow.riderName}${deliveryWorkflow.riderPhone ? ` / ${deliveryWorkflow.riderPhone}` : ""}`
                  : "No rider currently attached."}
              </p>
            </div>

            <RouteFeedbackLink
              href={getDeliveryBoardHref(deliveryWorkflow)}
              className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-system-fill/56 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-system-fill/76"
            >
              Open delivery board
            </RouteFeedbackLink>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <ContextPill
              label="Stage"
              value={getDeliveryStageLabel(deliveryWorkflow?.deliveryStage ?? "not_ready")}
            />
            <ContextPill
              label="Assignment"
              value={
                deliveryWorkflow?.assignmentStatus
                  ? formatStatusLabel(deliveryWorkflow.assignmentStatus)
                  : "Awaiting rider"
              }
            />
            <ContextPill
              label="Last move"
              value={
                deliveryWorkflow?.latestDeliveryEventType
                  ? `${formatStatusLabel(deliveryWorkflow.latestDeliveryEventType)} - ${formatTimestamp(deliveryWorkflow.latestDeliveryEventAt)}`
                  : "No delivery event yet"
              }
            />
          </div>

          {deliveryWorkflow?.riderVehicleType ? (
            <p className="mt-3 text-sm text-secondary-label">
              Vehicle: {deliveryWorkflow.riderVehicleType}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ContextPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] bg-system-fill/44 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-label">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium leading-6 text-label">{value}</p>
    </div>
  );
}

function ActionSubmitButton(
  props: Omit<ComponentProps<"button">, "type"> & {
    pendingLabel: string;
  }
) {
  const { pending } = useFormStatus();
  const { children, pendingLabel, disabled, ...rest } = props;

  return (
    <button type="submit" disabled={disabled || pending} {...rest}>
      {pending ? pendingLabel : children}
    </button>
  );
}
