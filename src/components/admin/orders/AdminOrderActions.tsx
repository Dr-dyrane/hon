"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ComponentProps, FormEvent } from "react";
import type {
  AdminDeliveryRider,
  AdminOrderDeliveryWorkflow,
  AdminOrderInventoryReadiness,
  AdminOrderInventoryReadinessRow,
} from "@/lib/db/types";
import {
  assignOrderRiderAction,
  cancelOrderAction,
  markReadyForDispatchAction,
  reviewPaymentAction,
  submitAcceptOrderRequestAction,
  updateOrderInventoryAction,
  updateOrderAssignmentStatusAction,
} from "@/app/(admin)/admin/orders/[orderId]/actions";
import { RouteFeedbackLink } from "@/components/ui/RouteFeedbackLink";
import { ActionStatusMessage } from "@/components/ui/ActionStatusMessage";
import { useFeedback } from "@/components/providers/FeedbackProvider";
import type { OrderAdminActionState } from "@/lib/orders/action-state";
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
const INVENTORY_ACTION_BUTTON_CLASS =
  "min-h-[36px] rounded-full bg-system-fill/56 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-system-fill/76 disabled:opacity-50";

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

function getInventoryStatusLabel(
  status: AdminOrderInventoryReadinessRow["status"]
) {
  if (status === "blocked") {
    return "Blocked";
  }

  if (status === "low") {
    return "Low";
  }

  return "Ready";
}

function getInventoryStatusTone(
  status: AdminOrderInventoryReadinessRow["status"]
) {
  if (status === "blocked") {
    return "bg-red-500/12 text-red-500";
  }

  if (status === "low") {
    return "bg-accent/12 text-accent";
  }

  return "bg-system-fill/52 text-secondary-label";
}

function getBlockedTargetOnHand(row: AdminOrderInventoryReadinessRow) {
  if (row.available === null || row.onHand === null) {
    return row.quantity;
  }

  return row.onHand + Math.max(row.quantity - row.available, 0);
}

function getLowBufferTargetOnHand(row: AdminOrderInventoryReadinessRow) {
  const currentOnHand = row.onHand ?? 0;

  if (row.available === null) {
    return currentOnHand + Math.max(row.reorderThreshold ?? 0, 1);
  }

  const remainingAfterAccept = row.available - row.quantity;
  const minimumRemaining = Math.max(row.reorderThreshold ?? 0, 0) + 1;
  return currentOnHand + Math.max(minimumRemaining - remainingAfterAccept, 1);
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

type FeedbackTone = "error" | "info" | "success";

type ActionFeedbackState = {
  tone: FeedbackTone;
  message: string;
};

function isActionSuccessful(result: OrderAdminActionState) {
  return result.status === "success";
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
  const [isActionPending, startActionTransition] = useTransition();
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedbackState | null>(
    null
  );
  const [isInventoryPending, startInventoryTransition] = useTransition();
  const [inventoryBusyKey, setInventoryBusyKey] = useState<string | null>(null);
  const [inventoryFeedback, setInventoryFeedback] = useState<ActionFeedbackState | null>(
    null
  );
  const workflowCopy = getWorkflowCopy({
    isRequestPending,
    paymentActions,
    requestReadiness,
    deliveryWorkflow,
  });
  const needsRiderAssignment = canAssignRider(deliveryWorkflow);
  const hasRiders = riders.length > 0;
  const inventoryRows = requestReadiness?.rows ?? [];
  const blockedInventoryRows = inventoryRows.filter((row) => row.status === "blocked");
  const lowInventoryRows = inventoryRows.filter((row) => row.status === "low");

  function runOrderAction(input: {
    actionKey: string;
    pendingMessage: string;
    action: (formData: FormData) => Promise<OrderAdminActionState>;
    formData: FormData;
  }) {
    setBusyActionKey(input.actionKey);
    setActionFeedback({
      tone: "info",
      message: input.pendingMessage,
    });

    startActionTransition(async () => {
      try {
        const result = await input.action(input.formData);
        setBusyActionKey(null);

        if (!isActionSuccessful(result)) {
          setActionFeedback({
            tone: "error",
            message: result.message || "Unable to update this order.",
          });
          feedback.blocked();
          return;
        }

        setActionFeedback({
          tone: "success",
          message: result.message || "Order updated.",
        });
        feedback.success();
        router.refresh();
      } catch (error) {
        setBusyActionKey(null);
        setActionFeedback({
          tone: "error",
          message:
            error instanceof Error ? error.message : "Unable to update this order.",
        });
        feedback.blocked();
      }
    });
  }

  function runInventoryAdjustment(
    row: AdminOrderInventoryReadinessRow,
    keySuffix: string,
    nextOnHand: number
  ) {
    setInventoryBusyKey(`${row.variantId}:${keySuffix}`);
    setInventoryFeedback({
      tone: "info",
      message: `Updating ${row.title} stock...`,
    });

    startInventoryTransition(async () => {
      try {
        const result = await updateOrderInventoryAction({
          orderId,
          productId: row.productId,
          variantId: row.variantId,
          onHand: nextOnHand,
          reorderThreshold: row.reorderThreshold,
        });

        if (!result.success) {
          setInventoryBusyKey(null);
          setInventoryFeedback({
            tone: "error",
            message: result.error || "Unable to update stock.",
          });
          feedback.blocked();
          return;
        }

        setInventoryBusyKey(null);
        setInventoryFeedback({
          tone: "success",
          message: result.message || "Stock updated.",
        });
        feedback.success();
        router.refresh();
      } catch (error) {
        setInventoryBusyKey(null);
        setInventoryFeedback({
          tone: "error",
          message: error instanceof Error ? error.message : "Unable to update stock.",
        });
        feedback.blocked();
      }
    });
  }

  function buildManagedSubmit(input: {
    actionKey: string;
    pendingMessage: string;
    action: (formData: FormData) => Promise<OrderAdminActionState>;
    feedbackKind: "selection" | "tap";
  }) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (input.feedbackKind === "selection") {
        feedback.selection();
      } else {
        feedback.tap();
      }

      const nativeEvent = event.nativeEvent;
      const submitter =
        nativeEvent instanceof SubmitEvent ? nativeEvent.submitter : null;
      const formData = new FormData(event.currentTarget);

      if (
        (submitter instanceof HTMLButtonElement ||
          submitter instanceof HTMLInputElement) &&
        submitter.name
      ) {
        formData.set(submitter.name, submitter.value);
      }

      runOrderAction({
        actionKey: input.actionKey,
        pendingMessage: input.pendingMessage,
        action: input.action,
        formData,
      });
    };
  }

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
                className="flex"
                onSubmit={buildManagedSubmit({
                  actionKey: "accept-request",
                  pendingMessage: "Accepting request and opening transfer...",
                  action: submitAcceptOrderRequestAction,
                  feedbackKind: "selection",
                })}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="note" value="Request accepted from order detail." />
                <ActionSubmitButton
                  className={PRIMARY_BUTTON_CLASS}
                  isPending={busyActionKey === "accept-request"}
                  pendingLabel="Checking stock"
                  disabled={
                    isActionPending ||
                    isInventoryPending ||
                    requestReadiness?.canAccept === false
                  }
                >
                  {requestReadiness?.canAccept === false ? "Needs stock" : "Accept"}
                </ActionSubmitButton>
              </form>

              <form
                className="flex"
                onSubmit={buildManagedSubmit({
                  actionKey: "decline-request",
                  pendingMessage: "Declining request...",
                  action: cancelOrderAction,
                  feedbackKind: "tap",
                })}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="note" value="Request declined from order detail." />
                <ActionSubmitButton
                  className={DANGER_BUTTON_CLASS}
                  isPending={busyActionKey === "decline-request"}
                  pendingLabel="Declining"
                  disabled={isActionPending}
                >
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
                  className="flex"
                  onSubmit={buildManagedSubmit({
                    actionKey: `payment-${action}`,
                    pendingMessage: `${getPaymentReviewActionLabel(action)}...`,
                    action: reviewPaymentAction,
                    feedbackKind: "selection",
                  })}
                >
                  <input type="hidden" name="orderId" value={orderId} />
                  <input type="hidden" name="paymentId" value={paymentId} />
                  <ActionSubmitButton
                    className={cn(
                      action === "confirmed" ? PRIMARY_BUTTON_CLASS : SECONDARY_BUTTON_CLASS
                    )}
                    isPending={busyActionKey === `payment-${action}`}
                    pendingLabel="Saving"
                    disabled={isActionPending}
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
              className="flex"
              onSubmit={buildManagedSubmit({
                actionKey: "ready-for-dispatch",
                pendingMessage: "Moving order into dispatch...",
                action: markReadyForDispatchAction,
                feedbackKind: "selection",
              })}
            >
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="note" value="Marked ready from order detail." />
              <ActionSubmitButton
                className={PRIMARY_BUTTON_CLASS}
                isPending={busyActionKey === "ready-for-dispatch"}
                pendingLabel="Updating"
                disabled={isActionPending}
              >
                Ready to send
              </ActionSubmitButton>
            </form>
          ) : needsRiderAssignment ? (
            hasRiders ? (
              <>
                <form
                  id="admin-order-primary-form"
                  className="grid gap-2 sm:col-span-2 xl:col-span-2"
                  onSubmit={buildManagedSubmit({
                    actionKey: "assign-rider",
                    pendingMessage:
                      deliveryWorkflow?.assignmentStatus === "failed"
                        ? "Reassigning rider..."
                        : "Assigning rider...",
                    action: assignOrderRiderAction,
                    feedbackKind: "selection",
                  })}
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
                  <ActionSubmitButton
                    className={PRIMARY_BUTTON_CLASS}
                    isPending={busyActionKey === "assign-rider"}
                    pendingLabel="Assigning"
                    disabled={isActionPending}
                  >
                    {deliveryWorkflow?.assignmentStatus === "failed"
                      ? "Reassign rider"
                      : "Assign rider"}
                  </ActionSubmitButton>
                </form>

                {deliveryWorkflow?.assignmentId &&
                deliveryWorkflow.assignmentStatus === "failed" ? (
                  <form
                    className="flex"
                    onSubmit={buildManagedSubmit({
                      actionKey: "return-to-queue",
                      pendingMessage: "Returning order to the dispatch queue...",
                      action: updateOrderAssignmentStatusAction,
                      feedbackKind: "tap",
                    })}
                  >
                    <input type="hidden" name="orderId" value={orderId} />
                    <input
                      type="hidden"
                      name="assignmentId"
                      value={deliveryWorkflow.assignmentId}
                    />
                    <input type="hidden" name="nextStatus" value="returned" />
                    <input type="hidden" name="note" value="Returned to dispatch queue from order detail." />
                    <ActionSubmitButton
                      className={SECONDARY_BUTTON_CLASS}
                      isPending={busyActionKey === "return-to-queue"}
                      pendingLabel="Returning"
                      disabled={isActionPending}
                    >
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
                className="flex"
                onSubmit={buildManagedSubmit({
                  actionKey: "picked-up",
                  pendingMessage: "Confirming rider pickup...",
                  action: updateOrderAssignmentStatusAction,
                  feedbackKind: "selection",
                })}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="picked_up" />
                <input type="hidden" name="note" value="Pickup confirmed from order detail." />
                <ActionSubmitButton
                  className={PRIMARY_BUTTON_CLASS}
                  isPending={busyActionKey === "picked-up"}
                  pendingLabel="Saving"
                  disabled={isActionPending}
                >
                  Picked up
                </ActionSubmitButton>
              </form>

              <form
                className="flex"
                onSubmit={buildManagedSubmit({
                  actionKey: "remove-rider",
                  pendingMessage: "Removing rider...",
                  action: updateOrderAssignmentStatusAction,
                  feedbackKind: "tap",
                })}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="unassigned" />
                <input type="hidden" name="note" value="Rider removed from order detail." />
                <ActionSubmitButton
                  className={SECONDARY_BUTTON_CLASS}
                  isPending={busyActionKey === "remove-rider"}
                  pendingLabel="Removing"
                  disabled={isActionPending}
                >
                  Remove rider
                </ActionSubmitButton>
              </form>
            </>
          ) : deliveryWorkflow?.assignmentId &&
            deliveryWorkflow.assignmentStatus === "picked_up" ? (
            <>
              <form
                id="admin-order-primary-form"
                className="flex"
                onSubmit={buildManagedSubmit({
                  actionKey: "start-delivery",
                  pendingMessage: "Starting live delivery...",
                  action: updateOrderAssignmentStatusAction,
                  feedbackKind: "selection",
                })}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="out_for_delivery" />
                <input type="hidden" name="note" value="Delivery started from order detail." />
                <ActionSubmitButton
                  className={PRIMARY_BUTTON_CLASS}
                  isPending={busyActionKey === "start-delivery"}
                  pendingLabel="Starting"
                  disabled={isActionPending}
                >
                  Out for delivery
                </ActionSubmitButton>
              </form>

              <form
                className="flex"
                onSubmit={buildManagedSubmit({
                  actionKey: "revert-pickup",
                  pendingMessage: "Reverting pickup...",
                  action: updateOrderAssignmentStatusAction,
                  feedbackKind: "tap",
                })}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="assigned" />
                <input type="hidden" name="note" value="Pickup reverted from order detail." />
                <ActionSubmitButton
                  className={SECONDARY_BUTTON_CLASS}
                  isPending={busyActionKey === "revert-pickup"}
                  pendingLabel="Reverting"
                  disabled={isActionPending}
                >
                  Back to assigned
                </ActionSubmitButton>
              </form>
            </>
          ) : deliveryWorkflow?.assignmentId &&
            deliveryWorkflow.assignmentStatus === "out_for_delivery" ? (
            <>
              <form
                id="admin-order-primary-form"
                className="flex"
                onSubmit={buildManagedSubmit({
                  actionKey: "mark-delivered",
                  pendingMessage: "Closing delivery...",
                  action: updateOrderAssignmentStatusAction,
                  feedbackKind: "selection",
                })}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="delivered" />
                <input type="hidden" name="note" value="Delivered from order detail." />
                <ActionSubmitButton
                  className={PRIMARY_BUTTON_CLASS}
                  isPending={busyActionKey === "mark-delivered"}
                  pendingLabel="Closing"
                  disabled={isActionPending}
                >
                  Delivered
                </ActionSubmitButton>
              </form>

              <form
                className="flex"
                onSubmit={buildManagedSubmit({
                  actionKey: "fail-delivery",
                  pendingMessage: "Recording failed delivery...",
                  action: updateOrderAssignmentStatusAction,
                  feedbackKind: "tap",
                })}
              >
                <input type="hidden" name="orderId" value={orderId} />
                <input
                  type="hidden"
                  name="assignmentId"
                  value={deliveryWorkflow.assignmentId}
                />
                <input type="hidden" name="nextStatus" value="failed" />
                <input type="hidden" name="note" value="Delivery failed from order detail." />
                <ActionSubmitButton
                  className={SECONDARY_BUTTON_CLASS}
                  isPending={busyActionKey === "fail-delivery"}
                  pendingLabel="Saving"
                  disabled={isActionPending}
                >
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
            <form
              className="flex"
              onSubmit={buildManagedSubmit({
                actionKey: "cancel-order",
                pendingMessage: "Cancelling order...",
                action: cancelOrderAction,
                feedbackKind: "tap",
              })}
            >
              <input type="hidden" name="orderId" value={orderId} />
              <input type="hidden" name="note" value="Cancelled from order detail." />
              <ActionSubmitButton
                className={DANGER_BUTTON_CLASS}
                isPending={busyActionKey === "cancel-order"}
                pendingLabel="Cancelling"
                disabled={isActionPending}
              >
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

        {isRequestPending && inventoryRows.length > 0 ? (
          <div className="mt-3 rounded-[24px] bg-system-fill/34 px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                  Inventory check
                </p>
                <p className="mt-1 text-sm text-secondary-label">
                  {blockedInventoryRows.length > 0
                    ? "Fix blocked lines here, then accept again."
                    : lowInventoryRows.length > 0
                      ? "This request can move now, but these lines will land at or below buffer."
                      : "Inventory lines are ready."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {blockedInventoryRows.length > 0 ? (
                  <span className="rounded-full bg-red-500/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-red-500">
                    {blockedInventoryRows.length} blocked
                  </span>
                ) : null}
                {lowInventoryRows.length > 0 ? (
                  <span className="rounded-full bg-accent/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                    {lowInventoryRows.length} low
                  </span>
                ) : null}
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {inventoryRows.map((row) => {
                const coverTarget = getBlockedTargetOnHand(row);
                const bufferTarget = getLowBufferTargetOnHand(row);
                const currentOnHand = row.onHand ?? 0;
                const addOneTarget = currentOnHand + 1;
                const addFiveTarget = currentOnHand + 5;
                const coverKey = `${row.variantId}:cover`;
                const bufferKey = `${row.variantId}:buffer`;
                const addOneKey = `${row.variantId}:add-1`;
                const addFiveKey = `${row.variantId}:add-5`;

                return (
                  <article
                    key={row.variantId}
                    className="rounded-[22px] bg-[color:var(--surface)]/80 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-label">{row.title}</p>
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                              getInventoryStatusTone(row.status)
                            )}
                          >
                            {getInventoryStatusLabel(row.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-secondary-label">{row.detail}</p>
                      </div>

                      {row.productId ? (
                        <RouteFeedbackLink
                          href={`/admin/catalog/products/${row.productId}`}
                          className="inline-flex min-h-[36px] items-center justify-center rounded-full bg-system-fill/56 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-system-fill/76"
                        >
                          Open product
                        </RouteFeedbackLink>
                      ) : null}
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                      <InventoryMetric label="Need" value={`${row.quantity}`} />
                      <InventoryMetric
                        label="Available"
                        value={row.available == null ? "-" : `${row.available}`}
                      />
                      <InventoryMetric
                        label="On hand"
                        value={row.onHand == null ? "-" : `${row.onHand}`}
                      />
                      <InventoryMetric
                        label="Reserved"
                        value={row.reserved == null ? "-" : `${row.reserved}`}
                      />
                    </div>

                    {row.status !== "ready" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {row.status === "blocked" ? (
                          <button
                            type="button"
                            disabled={isInventoryPending || isActionPending}
                            onClick={() =>
                              runInventoryAdjustment(row, "cover", coverTarget)
                            }
                            className={cn(
                              INVENTORY_ACTION_BUTTON_CLASS,
                              inventoryBusyKey === coverKey && "pointer-events-none opacity-50"
                            )}
                          >
                            {inventoryBusyKey === coverKey ? "Saving" : "Cover need"}
                          </button>
                        ) : null}
                        {row.status === "low" ? (
                          <button
                            type="button"
                            disabled={isInventoryPending || isActionPending}
                            onClick={() =>
                              runInventoryAdjustment(row, "buffer", bufferTarget)
                            }
                            className={cn(
                              INVENTORY_ACTION_BUTTON_CLASS,
                              inventoryBusyKey === bufferKey && "pointer-events-none opacity-50"
                            )}
                          >
                            {inventoryBusyKey === bufferKey ? "Saving" : "Lift buffer"}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={isInventoryPending || isActionPending}
                          onClick={() =>
                            runInventoryAdjustment(row, "add-1", addOneTarget)
                          }
                          className={cn(
                            INVENTORY_ACTION_BUTTON_CLASS,
                            inventoryBusyKey === addOneKey && "pointer-events-none opacity-50"
                          )}
                        >
                          {inventoryBusyKey === addOneKey ? "Saving" : "+1"}
                        </button>
                        <button
                          type="button"
                          disabled={isInventoryPending || isActionPending}
                          onClick={() =>
                            runInventoryAdjustment(row, "add-5", addFiveTarget)
                          }
                          className={cn(
                            INVENTORY_ACTION_BUTTON_CLASS,
                            inventoryBusyKey === addFiveKey && "pointer-events-none opacity-50"
                          )}
                        >
                          {inventoryBusyKey === addFiveKey ? "Saving" : "+5"}
                        </button>
                        {row.reorderThreshold != null ? (
                          <span className="inline-flex min-h-[36px] items-center rounded-full bg-system-fill/44 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary-label">
                            Reorder {row.reorderThreshold}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>

            {inventoryFeedback ? (
              <ActionStatusMessage tone={inventoryFeedback.tone} className="mt-3">
                {inventoryFeedback.message}
              </ActionStatusMessage>
            ) : null}
          </div>
        ) : null}

        {actionFeedback ? (
          <ActionStatusMessage tone={actionFeedback.tone} className="mt-3">
            {actionFeedback.message}
          </ActionStatusMessage>
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

function InventoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-system-fill/42 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-label">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-label">{value}</p>
    </div>
  );
}

function ActionSubmitButton(
  props: Omit<ComponentProps<"button">, "type"> & {
    isPending: boolean;
    pendingLabel: string;
  }
) {
  const { children, isPending, pendingLabel, disabled, ...rest } = props;

  return (
    <button type="submit" disabled={disabled || isPending} {...rest}>
      {isPending ? pendingLabel : children}
    </button>
  );
}
