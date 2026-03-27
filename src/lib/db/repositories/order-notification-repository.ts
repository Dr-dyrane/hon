import "server-only";

import { isDatabaseConfigured, query } from "@/lib/db/client";
import { getStoragePublicUrl } from "@/lib/storage/s3";

export type OrderNotificationItemSnapshot = {
  orderItemId: string;
  title: string;
  quantity: number;
  unitPriceNgn: number;
  lineTotalNgn: number;
  productSlug: string | null;
  imageUrl: string | null;
};

export type OrderNotificationSnapshot = {
  orderId: string;
  orderNumber: string;
  hasAccountAccess: boolean;
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
  itemCount: number;
  items: OrderNotificationItemSnapshot[];
};

function resolveNotificationMediaUrl(storageKey: string | null) {
  if (!storageKey) {
    return null;
  }

  if (/^https?:\/\//i.test(storageKey) || storageKey.startsWith("/")) {
    return storageKey;
  }

  try {
    return getStoragePublicUrl(storageKey);
  } catch {
    return null;
  }
}

export async function getOrderNotificationSnapshot(orderId: string) {
  if (!orderId || !isDatabaseConfigured()) {
    return null;
  }

  const result = await query<OrderNotificationSnapshot>(
    `
      select
        o.id as "orderId",
        o.public_order_number as "orderNumber",
        (o.user_id is not null) as "hasAccountAccess",
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
        coalesce(sum(oi.quantity), 0)::int as "itemCount",
        coalesce(
          nullif(o.delivery_address_snapshot ->> 'formatted', ''),
          nullif(o.delivery_address_snapshot ->> 'line1', ''),
          'Pending'
        ) as "deliveryAddress"
      from app.orders o
      left join app.order_items oi
        on oi.order_id = o.id
      left join app.payments p
        on p.order_id = o.id
      left join app.bank_accounts ba
        on ba.id = p.bank_account_id
      where o.id = $1
      group by
        o.id,
        o.public_order_number,
        o.user_id,
        o.customer_name,
        o.customer_email,
        o.customer_phone_e164,
        o.total_ngn,
        o.status,
        o.payment_status,
        o.fulfillment_status,
        o.transfer_reference,
        o.transfer_deadline_at,
        o.placed_at,
        ba.bank_name,
        ba.account_name,
        ba.account_number,
        ba.instructions
      limit 1
    `,
    [orderId],
    {
      actor: {
        role: "admin",
      },
    }
  );

  const order = result.rows[0] ?? null;

  if (!order) {
    return null;
  }

  const itemsResult = await query<
    Omit<OrderNotificationItemSnapshot, "imageUrl"> & { imageStorageKey: string | null }
  >(
    `
      select
        oi.id as "orderItemId",
        oi.title,
        oi.quantity,
        oi.unit_price_ngn as "unitPriceNgn",
        oi.line_total_ngn as "lineTotalNgn",
        coalesce(oi.snapshot ->> 'productId', p.slug) as "productSlug",
        image_media.storage_key as "imageStorageKey"
      from app.order_items oi
      left join app.product_variants v
        on v.id = oi.variant_id
      left join app.products p
        on p.id = v.product_id
      left join lateral (
        select pm.storage_key
        from app.product_media pm
        where (
            (p.id is not null and pm.product_id = p.id)
            or (v.id is not null and pm.variant_id = v.id)
          )
          and pm.media_type = 'image'
        order by
          case when v.id is not null and pm.variant_id = v.id then 0 else 1 end asc,
          pm.is_primary desc,
          pm.sort_order asc,
          pm.created_at asc
        limit 1
      ) image_media on true
      where oi.order_id = $1
      order by oi.created_at asc
    `,
    [orderId],
    {
      actor: {
        role: "admin",
      },
    }
  );

  return {
    ...order,
    items: itemsResult.rows.map((item) => ({
      ...item,
      imageUrl: resolveNotificationMediaUrl(item.imageStorageKey),
    })),
  };
}
