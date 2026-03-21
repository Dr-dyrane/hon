import "server-only";

import {
  isDatabaseConfigured,
  query,
  type DatabaseActorContext,
  withTransaction,
} from "@/lib/db/client";
import { restockInventoryForReturnedOrder } from "@/lib/db/repositories/order-inventory";
import {
  sendOrderRefundedNotification,
  sendOrderReturnDecisionNotification,
  sendOrderReturnRequestedNotifications,
} from "@/lib/email/orders";
import type {
  AdminOrderReturnQueueRow,
  OrderReturnCaseRow,
  OrderReturnEventRow,
} from "@/lib/db/types";

const OPEN_RETURN_STATUSES = ["requested", "approved", "received"] as const;
const RETURN_TRANSITIONS: Record<
  OrderReturnCaseRow["status"],
  readonly OrderReturnCaseRow["status"][]
> = {
  requested: ["approved", "rejected"],
  approved: ["received", "refunded"],
  rejected: [],
  received: ["refunded"],
  refunded: [],
};

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? null;
}

function normalizeText(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function buildAdminActor(email?: string | null): DatabaseActorContext | undefined {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return undefined;
  }

  return {
    email: normalizedEmail,
    role: "admin",
  };
}

function buildCustomerActor(input: {
  email?: string | null;
  guestOrderId?: string | null;
  userId?: string | null;
}): DatabaseActorContext | undefined {
  const normalizedEmail = normalizeEmail(input.email);

  if (!normalizedEmail && !input.guestOrderId) {
    return undefined;
  }

  return {
    email: normalizedEmail,
    userId: input.userId ?? null,
    role: "customer",
    guestOrderId: input.guestOrderId ?? null,
  };
}

export async function listOpenOrderReturnCasesForAdmin(
  limit = 20,
  actorEmail?: string | null
) {
  if (!isDatabaseConfigured()) {
    return [] satisfies AdminOrderReturnQueueRow[];
  }

  const result = await query<AdminOrderReturnQueueRow>(
    `
      select
        rc.id as "returnCaseId",
        o.id as "orderId",
        o.public_order_number as "orderNumber",
        o.customer_name as "customerName",
        o.customer_phone_e164 as "customerPhone",
        rc.status,
        rc.reason,
        rc.requested_refund_amount_ngn as "requestedRefundAmountNgn",
        rc.approved_refund_amount_ngn as "approvedRefundAmountNgn",
        rc.refund_bank_name as "refundBankName",
        rc.refund_account_name as "refundAccountName",
        rc.refund_account_number as "refundAccountNumber",
        rc.created_at as "requestedAt"
      from app.order_return_cases rc
      inner join app.orders o
        on o.id = rc.order_id
      where rc.status in ('requested', 'approved', 'received')
      order by rc.created_at desc
      limit $1
    `,
    [limit],
    { actor: buildAdminActor(actorEmail) }
  );

  return result.rows;
}

export async function getLatestOrderReturnCase(
  orderId: string,
  actor?: DatabaseActorContext
) {
  if (!orderId || !isDatabaseConfigured()) {
    return null;
  }

  const result = await query<OrderReturnCaseRow>(
    `
      select
        id as "returnCaseId",
        order_id as "orderId",
        requested_by_user_id as "requestedByUserId",
        requested_by_email as "requestedByEmail",
        status,
        reason,
        details,
        requested_refund_amount_ngn as "requestedRefundAmountNgn",
        approved_refund_amount_ngn as "approvedRefundAmountNgn",
        refund_bank_name as "refundBankName",
        refund_account_name as "refundAccountName",
        refund_account_number as "refundAccountNumber",
        reviewed_by_user_id as "reviewedByUserId",
        reviewed_by_email as "reviewedByEmail",
        reviewed_at as "reviewedAt",
        rejected_at as "rejectedAt",
        received_at as "receivedAt",
        refunded_at as "refundedAt",
        refund_reference as "refundReference",
        resolution_note as "resolutionNote",
        created_at as "createdAt",
        updated_at as "updatedAt"
      from app.order_return_cases
      where order_id = $1
      order by created_at desc
      limit 1
    `,
    [orderId],
    { actor }
  );

  return result.rows[0] ?? null;
}

export async function listOrderReturnEvents(
  orderId: string,
  actor?: DatabaseActorContext
) {
  if (!orderId || !isDatabaseConfigured()) {
    return [] satisfies OrderReturnEventRow[];
  }

  const result = await query<OrderReturnEventRow>(
    `
      select
        id as "eventId",
        return_case_id as "returnCaseId",
        order_id as "orderId",
        actor_type as "actorType",
        actor_email as "actorEmail",
        action,
        note,
        metadata,
        created_at as "createdAt"
      from app.order_return_events
      where order_id = $1
      order by created_at desc
    `,
    [orderId],
    { actor }
  );

  return result.rows;
}

export async function requestOrderReturn(input: {
  orderId: string;
  reason: string;
  details?: string | null;
  refundBankName?: string | null;
  refundAccountName?: string | null;
  refundAccountNumber?: string | null;
  actorEmail?: string | null;
  actorUserId?: string | null;
  guestOrderId?: string | null;
}) {
  if (!isDatabaseConfigured()) {
    return null;
  }

  const reason = normalizeText(input.reason);
  const details = normalizeText(input.details);
  const refundBankName = normalizeText(input.refundBankName);
  const refundAccountName = normalizeText(input.refundAccountName);
  const refundAccountNumber = normalizeText(input.refundAccountNumber);

  if (!reason) {
    throw new Error("Tell Praxy what happened.");
  }

  if (!refundBankName || !refundAccountName || !refundAccountNumber) {
    throw new Error("Add the refund bank details.");
  }

  let createdOrderId: string | null = null;
  let createdReturnCaseId: string | null = null;

  await withTransaction(async (queryFn) => {
    const orderResult = await queryFn<{
      orderId: string;
      status: string;
      totalNgn: number;
    }>(
      `
        select
          id as "orderId",
          status,
          total_ngn as "totalNgn"
        from app.orders
        where id = $1
        limit 1
        for update
      `,
      [input.orderId]
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new Error("Order not found.");
    }

    if (order.status !== "delivered") {
      throw new Error("This order is not ready for a return.");
    }

    const openCaseResult = await queryFn<{ returnCaseId: string }>(
      `
        select id as "returnCaseId"
        from app.order_return_cases
        where order_id = $1
          and status = any($2::text[])
        limit 1
        for update
      `,
      [input.orderId, [...OPEN_RETURN_STATUSES]]
    );

    if (openCaseResult.rows[0]) {
      throw new Error("A return is already open for this order.");
    }

    const insertResult = await queryFn<{ returnCaseId: string }>(
      `
        insert into app.order_return_cases (
          order_id,
          requested_by_user_id,
          requested_by_email,
          status,
          reason,
          details,
          requested_refund_amount_ngn,
          refund_bank_name,
          refund_account_name,
          refund_account_number
        )
        values ($1, $2, $3, 'requested', $4, $5, $6, $7, $8, $9)
        returning id as "returnCaseId"
      `,
      [
        input.orderId,
        input.actorUserId ?? null,
        normalizeEmail(input.actorEmail),
        reason,
        details,
        order.totalNgn,
        refundBankName,
        refundAccountName,
        refundAccountNumber,
      ]
    );

    const returnCaseId = insertResult.rows[0]?.returnCaseId;

    if (!returnCaseId) {
      throw new Error("Return request could not be created.");
    }

    await queryFn(
      `
        insert into app.order_return_events (
          return_case_id,
          order_id,
          actor_type,
          actor_user_id,
          actor_email,
          action,
          note,
          metadata
        )
        values ($1, $2, 'customer', $3, $4, 'requested', $5, $6::jsonb)
      `,
      [
        returnCaseId,
        input.orderId,
        input.actorUserId ?? null,
        normalizeEmail(input.actorEmail),
        details,
        JSON.stringify({ reason }),
      ]
    );

    createdOrderId = input.orderId;
    createdReturnCaseId = returnCaseId;
  }, {
    actor: buildCustomerActor({
      email: input.actorEmail,
      guestOrderId: input.guestOrderId,
      userId: input.actorUserId,
    }),
  });

  if (createdOrderId) {
    await sendOrderReturnRequestedNotifications({
      orderId: createdOrderId,
    });
  }

  return createdReturnCaseId;
}

export async function advanceOrderReturnCase(input: {
  returnCaseId: string;
  action: "approved" | "rejected" | "received" | "refunded";
  actorEmail?: string | null;
  actorUserId?: string | null;
  note?: string | null;
  refundReference?: string | null;
}) {
  if (!isDatabaseConfigured()) {
    return;
  }

  const actorEmail = normalizeEmail(input.actorEmail);
  const note = normalizeText(input.note);
  const refundReference = normalizeText(input.refundReference);

  type ReturnNotificationPayload = {
    orderId: string;
    action: "approved" | "rejected" | "received" | "refunded";
    note: string | null;
    refundAmountNgn: number | null;
    refundReference: string | null;
  };

  const notificationPayload = await withTransaction<
    ReturnNotificationPayload | null
  >(async (queryFn) => {
    const currentResult = await queryFn<{
      returnCaseId: string;
      orderId: string;
      status: OrderReturnCaseRow["status"];
      requestedRefundAmountNgn: number;
      approvedRefundAmountNgn: number | null;
    }>(
      `
        select
          id as "returnCaseId",
          order_id as "orderId",
          status,
          requested_refund_amount_ngn as "requestedRefundAmountNgn",
          approved_refund_amount_ngn as "approvedRefundAmountNgn"
        from app.order_return_cases
        where id = $1
        limit 1
        for update
      `,
      [input.returnCaseId]
    );

    const current = currentResult.rows[0];

    if (!current) {
      throw new Error("Return case not found.");
    }

    if (!RETURN_TRANSITIONS[current.status].includes(input.action)) {
      throw new Error("That return step is not available.");
    }

    if (input.action === "received") {
      await restockInventoryForReturnedOrder(queryFn, current.orderId);
    }

    await queryFn(
      `
        update app.order_return_cases
        set
          status = $1,
          approved_refund_amount_ngn = case
            when $1 in ('approved', 'refunded')
              then coalesce(approved_refund_amount_ngn, requested_refund_amount_ngn)
            else approved_refund_amount_ngn
          end,
          reviewed_by_user_id = case
            when $1 in ('approved', 'rejected', 'refunded')
              then $2
            else reviewed_by_user_id
          end,
          reviewed_by_email = case
            when $1 in ('approved', 'rejected', 'refunded')
              then $3
            else reviewed_by_email
          end,
          reviewed_at = case
            when $1 in ('approved', 'rejected', 'refunded')
              then coalesce(reviewed_at, timezone('utc', now()))
            else reviewed_at
          end,
          rejected_at = case
            when $1 = 'rejected' then coalesce(rejected_at, timezone('utc', now()))
            else rejected_at
          end,
          received_at = case
            when $1 = 'received' then coalesce(received_at, timezone('utc', now()))
            else received_at
          end,
          refunded_at = case
            when $1 = 'refunded' then coalesce(refunded_at, timezone('utc', now()))
            else refunded_at
          end,
          refund_reference = case
            when $1 = 'refunded' then coalesce($4, refund_reference)
            else refund_reference
          end,
          resolution_note = coalesce($5, resolution_note)
        where id = $6
      `,
      [
        input.action,
        input.actorUserId ?? null,
        actorEmail,
        refundReference,
        note,
        input.returnCaseId,
      ]
    );

    await queryFn(
      `
        insert into app.order_return_events (
          return_case_id,
          order_id,
          actor_type,
          actor_user_id,
          actor_email,
          action,
          note,
          metadata
        )
        values ($1, $2, 'admin', $3, $4, $5, $6, $7::jsonb)
      `,
      [
        input.returnCaseId,
        current.orderId,
        input.actorUserId ?? null,
        actorEmail,
        input.action,
        note,
        JSON.stringify({
          refundReference,
        }),
      ]
    );

    return {
      orderId: current.orderId,
      action: input.action,
      note,
      refundAmountNgn:
        input.action === "refunded"
          ? current.approvedRefundAmountNgn ?? current.requestedRefundAmountNgn
          : current.approvedRefundAmountNgn,
      refundReference,
    };
  }, {
    actor: {
      userId: input.actorUserId ?? null,
      email: actorEmail,
      role: "admin",
    },
  });

  if (notificationPayload) {
    if (notificationPayload.action === "refunded") {
      await sendOrderRefundedNotification({
        orderId: notificationPayload.orderId,
        refundAmountNgn: notificationPayload.refundAmountNgn,
        refundReference: notificationPayload.refundReference,
        note: notificationPayload.note,
      });
      return;
    }

    await sendOrderReturnDecisionNotification({
      orderId: notificationPayload.orderId,
      action: notificationPayload.action,
      note: notificationPayload.note,
    });
  }
}
