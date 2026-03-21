import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";

export type OrderNotificationSnapshot = {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  totalNgn: number;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  transferReference: string;
  transferDeadlineAt: string | null;
  placedAt: string;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  instructions: string | null;
  deliveryAddress: string;
};

export async function getOrderNotificationSnapshot(orderId: string) {
  if (!orderId || !isDatabaseConfigured()) {
    return null;
  }

  const result = await query<OrderNotificationSnapshot>(
    `
      select
        o.id as "orderId",
        o.public_order_number as "orderNumber",
        o.customer_name as "customerName",
        o.customer_email as "customerEmail",
        o.customer_phone_e164 as "customerPhone",
        o.total_ngn as "totalNgn",
        o.status,
        o.payment_status as "paymentStatus",
        o.fulfillment_status as "fulfillmentStatus",
        o.transfer_reference as "transferReference",
        o.transfer_deadline_at as "transferDeadlineAt",
        o.placed_at as "placedAt",
        ba.bank_name as "bankName",
        ba.account_name as "accountName",
        ba.account_number as "accountNumber",
        ba.instructions,
        coalesce(
          nullif(o.delivery_address_snapshot ->> 'formatted', ''),
          nullif(o.delivery_address_snapshot ->> 'line1', ''),
          'Pending'
        ) as "deliveryAddress"
      from app.orders o
      left join app.payments p
        on p.order_id = o.id
      left join app.bank_accounts ba
        on ba.id = p.bank_account_id
      where o.id = $1
      limit 1
    `,
    [orderId],
    {
      actor: {
        role: "admin",
      },
    }
  );

  return result.rows[0] ?? null;
}
