import "server-only";

import { formatNgn } from "@/lib/commerce";
import { serverEnv } from "@/lib/config/server";
import { buildEditorialEmail } from "@/lib/email/brand";
import { sendResendEmail } from "@/lib/email/resend";
import { sendWorkspacePushToEmails } from "@/lib/push/web-push";
import {
  getOrderNotificationSnapshot,
  type OrderNotificationSnapshot,
} from "@/lib/db/repositories/order-notification-repository";
import { getWorkspaceNotificationPreference } from "@/lib/db/repositories/notification-preferences-repository";
import { createGuestOrderAccessToken } from "@/lib/orders/access";

function formatEmailTimestamp(value: string | null | undefined) {
  if (!value) {
    return "Now";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildPrimaryItemFact(order: OrderNotificationSnapshot) {
  const firstItem = order.items[0];

  if (!firstItem) {
    return null;
  }

  return `${firstItem.title} · ${firstItem.quantity} x ${formatNgn(firstItem.unitPriceNgn)}`;
}

function buildOrderFactLines(
  order: OrderNotificationSnapshot,
  options?: {
    includeDeadline?: boolean;
    includeDelivery?: boolean;
    includeCustomer?: boolean;
    includePlacedAt?: boolean;
  }
) {
  const includeDeadline = options?.includeDeadline ?? false;
  const includeDelivery = options?.includeDelivery ?? false;
  const includeCustomer = options?.includeCustomer ?? false;
  const includePlacedAt = options?.includePlacedAt ?? false;

  const facts: string[] = [];
  const deadlineLine =
    includeDeadline && order.transferDeadlineAt
      ? `By ${formatEmailTimestamp(order.transferDeadlineAt)}`
      : "";
  if (deadlineLine) facts.push(deadlineLine);
  if (includeDelivery) facts.push(order.deliveryAddress);
  if (includeCustomer) facts.push(order.customerName);
  if (includePlacedAt) facts.push(formatEmailTimestamp(order.placedAt));
  const itemFact = buildPrimaryItemFact(order);
  if (itemFact) facts.push(itemFact);

  return facts.slice(0, 3);
}

function buildOrderTransferBlock(order: OrderNotificationSnapshot) {
  if (!order.bankName && !order.accountName && !order.accountNumber) {
    return undefined;
  }

  const bank = order.bankName ?? "Pending bank";
  const accountName = order.accountName ?? "Pending account";
  const accountNumber = order.accountNumber ?? "Pending number";
  const instructions = order.instructions ? `<p style="margin:8px 0 0;font-size:14px;color:#374151;">${order.instructions}</p>` : "";

  return `
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9ca3af;">Transfer</p>
    <p style="margin:0 0 4px;font-size:14px;color:#111111;">${bank}</p>
    <p style="margin:0 0 4px;font-size:14px;color:#111111;">${accountName}</p>
    <p style="margin:0 0 4px;font-size:14px;color:#111111;">${accountNumber}</p>
    ${instructions}
  `;
}

function buildOrderEditorial(input: {
  eyebrow: string;
  title: string;
  subtitle: string;
  order: OrderNotificationSnapshot;
  facts?: string[];
  action?: string;
  block?: string;
  cta?: { label: string; url: string };
  footnote?: string;
}) {
  return buildEditorialEmail({
    eyebrow: input.eyebrow,
    title: input.title,
    subtitle: input.subtitle,
    highlight: formatNgn(input.order.totalNgn),
    reference: input.order.orderNumber,
    facts: input.facts,
    action: input.action,
    block: input.block,
    cta: input.cta,
    footnote: input.footnote,
  });
}

function buildGuestOrderLink(orderId: string) {
  const token = createGuestOrderAccessToken(orderId);

  return `${serverEnv.public.appUrl}/checkout/orders/${orderId}?access=${encodeURIComponent(token)}`;
}

function buildAccountOrderLink(orderId: string) {
  return `${serverEnv.public.appUrl}/account/orders/${orderId}`;
}

function buildAccountTrackingLink(orderId: string) {
  return `${serverEnv.public.appUrl}/account/tracking/${orderId}`;
}

function buildAdminOrderLink(orderId: string) {
  return `${serverEnv.public.appUrl}/admin/orders/${orderId}`;
}

function buildAdminPaymentsLink() {
  return `${serverEnv.public.appUrl}/admin/payments`;
}

const ORDER_EMAIL_PREVIEW_SNAPSHOT: OrderNotificationSnapshot = {
  orderId: "preview-order-id",
  orderNumber: "HOP-7A9F102C",
  customerName: "Amina Musa",
  customerEmail: "amina@example.com",
  customerPhone: "+2348012345678",
  totalNgn: 58900,
  status: "awaiting_transfer",
  paymentStatus: "awaiting_transfer",
  fulfillmentStatus: "pending",
  transferReference: "HOP-7A9F102C",
  transferDeadlineAt: "2026-03-25T18:00:00.000Z",
  placedAt: "2026-03-23T11:26:00.000Z",
  bankName: "Providus Bank",
  accountName: "House of Prax Ltd",
  accountNumber: "0123456789",
  instructions: "Use your transfer reference as narration to speed up review.",
  deliveryAddress: "No. 12 Admiralty Way, Lekki Phase 1, Lagos",
  itemCount: 3,
  items: [
    {
      orderItemId: "preview-item-1",
      title: "Sea Moss Berry Blend",
      quantity: 1,
      unitPriceNgn: 21900,
      lineTotalNgn: 21900,
      productSlug: "sea-moss-berry",
      imageUrl: null,
    },
    {
      orderItemId: "preview-item-2",
      title: "Tropical Hydration Mix",
      quantity: 2,
      unitPriceNgn: 18500,
      lineTotalNgn: 37000,
      productSlug: "tropical-hydration",
      imageUrl: null,
    },
  ],
};

export function buildOrderPlacedPreviewHtml() {
  const order = ORDER_EMAIL_PREVIEW_SNAPSHOT;
  return buildOrderEditorial({
    eyebrow: "Order update",
    title: "Order received",
    subtitle: "Your House of Prax order is now in motion.",
    order,
    facts: buildOrderFactLines(order, { includeDeadline: true }),
    action: "Complete transfer before the deadline.",
    block: buildOrderTransferBlock(order),
    cta: {
      label: "Open order",
      url: `${serverEnv.public.appUrl}/checkout/orders/${order.orderId}`,
    },
    footnote: "Add payment proof after transfer.",
  });
}

export function buildDeliveryUpdatePreviewHtml() {
  const order = ORDER_EMAIL_PREVIEW_SNAPSHOT;

  return buildOrderEditorial({
    eyebrow: "Delivery",
    title: "On the way",
    subtitle: "Your blend is already moving.",
    order,
    facts: buildOrderFactLines(order, { includeDelivery: true }),
    action: "Track the drop in real time.",
    cta: {
      label: "Track order",
      url: `${serverEnv.public.appUrl}/checkout/orders/${order.orderId}/tracking`,
    },
  });
}

async function sendSafe(input: {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
}) {
  if (!serverEnv.email.resendApiKey || !serverEnv.email.resendFromEmail) {
    return false;
  }

  try {
    await sendResendEmail(input);
    return true;
  } catch (error) {
    console.error("Email delivery failed:", error);
    return false;
  }
}

async function loadOrder(orderId: string) {
  return getOrderNotificationSnapshot(orderId);
}

async function canSendWorkspaceCustomerEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const preference = await getWorkspaceNotificationPreference(email);
  return preference.workspaceEmailEnabled;
}

async function getSendableCustomerEmail(
  order: OrderNotificationSnapshot | null | undefined
) {
  const customerEmail = order?.customerEmail;

  if (!customerEmail) {
    return null;
  }

  if (!(await canSendWorkspaceCustomerEmail(customerEmail))) {
    return null;
  }

  return customerEmail;
}

async function getAdminWorkspaceRecipients() {
  const recipients: string[] = [];

  for (const email of serverEnv.auth.adminEmails) {
    const preference = await getWorkspaceNotificationPreference(email);

    if (preference.workspaceEmailEnabled) {
      recipients.push(email);
    }
  }

  return recipients;
}

async function sendCustomerWorkspacePush(
  order: OrderNotificationSnapshot | null | undefined,
  input: {
    title: string;
    body: string;
    href?: string;
    tag?: string;
  }
) {
  const customerEmail = order?.customerEmail?.trim().toLowerCase();

  if (!customerEmail || !order?.orderId) {
    return false;
  }

  return sendWorkspacePushToEmails([customerEmail], {
    title: input.title,
    body: input.body,
    href: input.href ?? buildAccountOrderLink(order.orderId),
    tag: input.tag ?? `order-${order.orderId}`,
  });
}

async function sendAdminWorkspacePush(
  input: {
    title: string;
    body: string;
    href: string;
    tag?: string;
  }
) {
  return sendWorkspacePushToEmails(serverEnv.auth.adminEmails, {
    title: input.title,
    body: input.body,
    href: input.href,
    tag: input.tag,
  });
}

export async function sendOrderPlacedNotifications(input: {
  orderId: string;
  customerLink?: string | null;
  notifyAdmin?: boolean;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const isRequest = order.status === "checkout_draft";
  const deadlineText = order.transferDeadlineAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(order.transferDeadlineAt))
    : "soon";
  const bankBlock = buildOrderTransferBlock(order);

  const customerEmail = await getSendableCustomerEmail(order);

  if (customerEmail) {
    await sendSafe({
      to: customerEmail,
      subject: isRequest
        ? `House of Prax request ${order.orderNumber}`
        : `House of Prax order ${order.orderNumber}`,
      text: isRequest
        ? `Your House of Prax request ${order.orderNumber} has been received. Transfer details will appear after approval.`
        : `Your House of Prax order ${order.orderNumber} is waiting for transfer. Use reference ${order.transferReference}. Total: ${formatNgn(order.totalNgn)}.`,
      html: buildOrderEditorial({
        eyebrow: "Order update",
        title: isRequest ? "Request received" : "Order received",
        subtitle: isRequest
          ? "Your request is now in motion."
          : "Your order is now in motion.",
        order,
        facts: buildOrderFactLines(order, {
          includeDeadline: !isRequest,
          includePlacedAt: true,
        }),
        action: !isRequest ? `Complete transfer before ${deadlineText}.` : undefined,
        block: !isRequest ? bankBlock : undefined,
        cta: input.customerLink
          ? {
              label: "Open order",
              url: input.customerLink,
            }
          : undefined,
        footnote: isRequest
          ? "You can follow this from your order page."
          : "Add payment proof after transfer.",
      }),
    });
  }

  await sendCustomerWorkspacePush(order, {
    title: isRequest ? "Request received" : "Order received",
    body: isRequest
      ? `Order #${order.orderNumber} is with Praxy now.`
      : `Use ${order.transferReference} to complete payment.`,
    href: buildAccountOrderLink(order.orderId),
  });

  const adminRecipients =
    input.notifyAdmin ?? true ? await getAdminWorkspaceRecipients() : [];

  if (adminRecipients.length > 0) {
    const adminHref = `${serverEnv.public.appUrl}/admin/orders/${order.orderId}`;
    await sendSafe({
      to: adminRecipients,
      subject: isRequest
        ? `New request ${order.orderNumber}`
        : `New order ${order.orderNumber}`,
      text: isRequest
        ? `New request ${order.orderNumber} from ${order.customerName}.`
        : `New order ${order.orderNumber} from ${order.customerName}. Total: ${formatNgn(order.totalNgn)}.`,
      html: buildEditorialEmail({
        eyebrow: "Operations console",
        title: isRequest ? "New request" : "New order",
        subtitle: isRequest
          ? "A new request needs attention."
          : "A new order needs attention.",
        reference: order.orderNumber,
        facts: [
          order.customerName,
          order.customerPhone,
          formatNgn(order.totalNgn),
        ],
        action: "Review and take action.",
        cta: {
          label: "Open console",
          url: adminHref,
        },
      }),
    });
  }

  if ((input.notifyAdmin ?? true) !== false) {
    await sendAdminWorkspacePush({
      title: isRequest ? "New request" : "New order",
      body: `${order.customerName} opened ${order.orderNumber}.`,
      href: buildAdminOrderLink(order.orderId),
      tag: `admin-order-${order.orderId}`,
    });
  }
}

export async function sendPaymentProofSubmittedNotifications(input: {
  orderId: string;
  customerLink?: string | null;
  proofIncluded?: boolean;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const proofIncluded = input.proofIncluded ?? true;
  const customerEmail = await getSendableCustomerEmail(order);

  if (customerEmail) {
    await sendSafe({
      to: customerEmail,
      subject: proofIncluded
        ? `Proof received for ${order.orderNumber}`
        : `Payment submitted for ${order.orderNumber}`,
      text: proofIncluded
        ? `Payment proof for order ${order.orderNumber} has been received and is waiting for review.`
        : `Payment for order ${order.orderNumber} has been marked as sent and is waiting for review.`,
      html: buildOrderEditorial({
        eyebrow: "Payment",
        title: proofIncluded ? "Proof received" : "Payment submitted",
        subtitle: proofIncluded
          ? "Your payment proof is in."
          : "Your payment is marked as sent.",
        order,
        facts: buildOrderFactLines(order, { includePlacedAt: true }),
        action: "Praxy will review this next.",
        cta: input.customerLink
          ? {
              label: "Open order",
              url: input.customerLink,
            }
          : undefined,
      }),
    });
  }

  await sendCustomerWorkspacePush(order, {
    title: proofIncluded ? "Proof received" : "Payment submitted",
    body: proofIncluded
      ? `Order #${order.orderNumber} is waiting for review.`
      : `Praxy will review order #${order.orderNumber} shortly.`,
  });

  const adminRecipients = await getAdminWorkspaceRecipients();

  if (adminRecipients.length > 0) {
    const adminHref = `${serverEnv.public.appUrl}/admin/payments`;
    await sendSafe({
      to: adminRecipients,
      subject: proofIncluded
        ? `Payment proof waiting for ${order.orderNumber}`
        : `Payment waiting for ${order.orderNumber}`,
      text: proofIncluded
        ? `Payment proof for order ${order.orderNumber} is ready for review.`
        : `Payment for order ${order.orderNumber} is ready for review.`,
      html: buildEditorialEmail({
        eyebrow: "Operations console",
        title: proofIncluded ? "Proof waiting" : "Payment waiting",
        subtitle: proofIncluded
          ? "A proof is waiting in queue."
          : "A payment is waiting in queue.",
        reference: order.orderNumber,
        facts: [order.customerName, formatNgn(order.totalNgn)],
        action: "Review and take action.",
        cta: {
          label: "Open console",
          url: adminHref,
        },
      }),
    });
  }

  await sendAdminWorkspacePush({
    title: proofIncluded ? "Proof waiting" : "Payment waiting",
    body: `${order.customerName} updated ${order.orderNumber}.`,
    href: buildAdminPaymentsLink(),
    tag: `admin-payment-${order.orderId}`,
  });
}

export async function sendTransferReminderNotification(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return false;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return false;
  }

  const orderHref = buildGuestOrderLink(order.orderId);

  const sent = await sendSafe({
    to: customerEmail,
    subject: `Transfer reminder for ${order.orderNumber}`,
    text: `Complete payment for order ${order.orderNumber} before the transfer window closes.`,
    html: buildOrderEditorial({
      eyebrow: "Transfer",
      title: "Transfer reminder",
      subtitle: "Your order is still open.",
      order,
      facts: buildOrderFactLines(order, { includeDeadline: true }),
      action: "Complete transfer before the window closes.",
      block: buildOrderTransferBlock(order),
      cta: {
        label: "Open order",
        url: orderHref,
      },
      footnote: "Confirm payment from your order page after transfer.",
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: "Transfer reminder",
    body: `Complete payment for #${order.orderNumber}.`,
  });

  return sent;
}

export async function sendReviewReminderNotification(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return false;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return false;
  }

  const orderHref = buildGuestOrderLink(order.orderId);

  const sent = await sendSafe({
    to: customerEmail,
    subject: `Rate ${order.orderNumber}`,
    text: `Leave a quick rating for order ${order.orderNumber}.`,
    html: buildOrderEditorial({
      eyebrow: "Review",
      title: "One quick rating",
      subtitle: "Your order has arrived.",
      order,
      facts: buildOrderFactLines(order, { includePlacedAt: true }),
      action: "A quick rating helps us close the loop.",
      cta: {
        label: "Rate order",
        url: orderHref,
      },
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: "Rate your order",
    body: `Order #${order.orderNumber} is ready for rating.`,
  });

  return sent;
}

export async function sendPaymentQueueReminderNotification(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  const adminRecipients = await getAdminWorkspaceRecipients();

  if (!order || adminRecipients.length === 0) {
    return false;
  }

  const sent = await sendSafe({
    to: adminRecipients,
    subject: `Payment still waiting for ${order.orderNumber}`,
    text: `Order ${order.orderNumber} still needs payment review.`,
    html: buildEditorialEmail({
      eyebrow: "Operations console",
      title: "Payment still waiting",
      subtitle: "A customer payment is still waiting.",
      reference: order.orderNumber,
      facts: [order.customerName, formatNgn(order.totalNgn)],
      action: "Review and take action.",
      cta: {
        label: "Open console",
        url: `${serverEnv.public.appUrl}/admin/payments`,
      },
      footnote: "Confirm, reject, or hold.",
    }),
  });

  await sendAdminWorkspacePush({
    title: "Payment still waiting",
    body: `${order.orderNumber} still needs review.`,
    href: buildAdminPaymentsLink(),
    tag: `admin-payment-${order.orderId}`,
  });

  return sent;
}

export async function sendReturnQueueReminderNotification(input: {
  orderId: string;
  status: "requested" | "approved" | "received";
}) {
  const order = await loadOrder(input.orderId);

  const adminRecipients = await getAdminWorkspaceRecipients();

  if (!order || adminRecipients.length === 0) {
    return false;
  }

  const copy =
    input.status === "requested"
      ? {
          subject: `Return still waiting for ${order.orderNumber}`,
          title: "Return still waiting",
          intro: "A return request is still waiting.",
          footer: "Approve or reject from order detail.",
        }
      : input.status === "approved"
        ? {
            subject: `Return still inbound for ${order.orderNumber}`,
            title: "Return still inbound",
            intro: "An approved return is still inbound.",
            footer: "Mark received when the item arrives.",
          }
        : {
            subject: `Refund still open for ${order.orderNumber}`,
            title: "Refund still open",
            intro: "A received return still needs refund action.",
            footer: "Complete refund from order detail.",
          };

  const sent = await sendSafe({
    to: adminRecipients,
    subject: copy.subject,
    text: `${copy.title}. Order ${order.orderNumber}.`,
    html: buildEditorialEmail({
      eyebrow: "Operations console",
      title: copy.title,
      subtitle: copy.intro,
      reference: order.orderNumber,
      facts: [order.customerName, formatNgn(order.totalNgn)],
      action: "Review and take action.",
      cta: {
        label: "Open console",
        url: `${serverEnv.public.appUrl}/admin/orders/${order.orderId}`,
      },
      footnote: copy.footer,
    }),
  });

  await sendAdminWorkspacePush({
    title: copy.title,
    body: `${order.orderNumber} still needs action.`,
    href: buildAdminOrderLink(order.orderId),
    tag: `admin-return-${order.orderId}`,
  });

  return sent;
}

export async function sendPaymentDecisionNotification(input: {
  orderId: string;
  action: "under_review" | "confirmed" | "rejected";
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return;
  }

  const copy =
    input.action === "confirmed"
      ? {
          subject: `Payment confirmed for ${order.orderNumber}`,
          title: "Payment confirmed",
          intro: "Your payment is confirmed. Preparation has started.",
        }
      : input.action === "rejected"
        ? {
            subject: `Payment update for ${order.orderNumber}`,
            title: "Payment needs attention",
            intro: "Your payment could not be confirmed yet.",
          }
        : {
            subject: `Payment under review for ${order.orderNumber}`,
            title: "Under review",
            intro: "Your payment is under review.",
          };

  await sendSafe({
    to: customerEmail,
    subject: copy.subject,
    text: `${copy.title}. Order ${order.orderNumber}.`,
    html: buildOrderEditorial({
      eyebrow: "Payment",
      title: copy.title,
      subtitle: copy.intro,
      order,
      facts: buildOrderFactLines(order),
      action: input.note ?? undefined,
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: copy.title,
    body:
      input.action === "confirmed"
        ? `Order #${order.orderNumber} is being prepared.`
        : input.action === "rejected"
          ? `Order #${order.orderNumber} needs another payment step.`
          : `Order #${order.orderNumber} is under review.`,
  });
}

export async function sendDeliveryStatusNotification(input: {
  orderId: string;
  status: "out_for_delivery" | "delivered";
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return;
  }

  const copy =
    input.status === "delivered"
      ? {
          subject: `Delivered: ${order.orderNumber}`,
          title: "Delivered",
          intro: "Your House of Prax order has arrived.",
        }
      : {
          subject: `Out for delivery: ${order.orderNumber}`,
          title: "On the way",
          intro: "Your blend is already moving.",
        };
  const orderHref = buildGuestOrderLink(order.orderId);

  await sendSafe({
    to: customerEmail,
    subject: copy.subject,
    text: `${copy.title}. Order ${order.orderNumber}.`,
    html: buildOrderEditorial({
      eyebrow: "Delivery",
      title: copy.title,
      subtitle: copy.intro,
      order,
      facts: buildOrderFactLines(order, { includeDelivery: true }),
      action:
        input.status === "delivered"
          ? "A quick rating helps Praxy close the loop."
          : "Track your delivery in real time.",
      cta: {
        label: input.status === "delivered" ? "Rate order" : "Open order",
        url: orderHref,
      },
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: copy.title,
    body:
      input.status === "delivered"
        ? `Order #${order.orderNumber} has been delivered.`
        : `Order #${order.orderNumber} is on the road.`,
    href:
      input.status === "delivered"
        ? buildAccountOrderLink(order.orderId)
        : buildAccountTrackingLink(order.orderId),
  });
}

export async function sendOrderCancelledNotification(input: {
  orderId: string;
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return;
  }

  await sendSafe({
    to: customerEmail,
    subject: `Order cancelled: ${order.orderNumber}`,
    text: `Order ${order.orderNumber} has been cancelled.`,
    html: buildOrderEditorial({
      eyebrow: "Order update",
      title: "Order cancelled",
      subtitle: "This order has been closed.",
      order,
      facts: buildOrderFactLines(order),
      action: input.note ?? undefined,
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: "Order cancelled",
    body: `Order #${order.orderNumber} has been closed.`,
  });
}

export async function sendOrderReturnRequestedNotifications(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (customerEmail) {
    await sendSafe({
      to: customerEmail,
      subject: `Return request received for ${order.orderNumber}`,
      text: `Your return request for order ${order.orderNumber} is with Praxy now.`,
      html: buildOrderEditorial({
        eyebrow: "Returns",
        title: "Return received",
        subtitle: "Your return request is now in motion.",
        order,
        facts: buildOrderFactLines(order, { includePlacedAt: true }),
        action: "We will update you after review.",
      }),
    });
  }

  await sendCustomerWorkspacePush(order, {
    title: "Return received",
    body: `Praxy is reviewing the return for #${order.orderNumber}.`,
  });

  const adminRecipients = await getAdminWorkspaceRecipients();

  if (adminRecipients.length > 0) {
    await sendSafe({
      to: adminRecipients,
      subject: `Return requested for ${order.orderNumber}`,
      text: `Order ${order.orderNumber} has a new return request.`,
      html: buildEditorialEmail({
        eyebrow: "Operations console",
        title: "Return requested",
        subtitle: "A return request needs attention.",
        reference: order.orderNumber,
        facts: [order.customerName, formatNgn(order.totalNgn)],
        action: "Review and take action.",
        cta: {
          label: "Open console",
          url: `${serverEnv.public.appUrl}/admin/orders/${order.orderId}`,
        },
      }),
    });
  }

  await sendAdminWorkspacePush({
    title: "Return requested",
    body: `${order.customerName} requested a return for ${order.orderNumber}.`,
    href: buildAdminOrderLink(order.orderId),
    tag: `admin-return-${order.orderId}`,
  });
}

export async function sendOrderReturnProofSubmittedNotifications(input: {
  orderId: string;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (customerEmail) {
    await sendSafe({
      to: customerEmail,
      subject: `Return proof received for ${order.orderNumber}`,
      text: `Return proof for order ${order.orderNumber} has been received.`,
      html: buildOrderEditorial({
        eyebrow: "Returns",
        title: "Return proof received",
        subtitle: "Your return proof is in.",
        order,
        facts: buildOrderFactLines(order, { includePlacedAt: true }),
        action: "Your return case is moving.",
        cta: {
          label: "Open order",
          url: buildGuestOrderLink(order.orderId),
        },
      }),
    });
  }

  await sendCustomerWorkspacePush(order, {
    title: "Return proof received",
    body: `Order #${order.orderNumber} is back in motion.`,
  });

  const adminRecipients = await getAdminWorkspaceRecipients();

  if (adminRecipients.length > 0) {
    await sendSafe({
      to: adminRecipients,
      subject: `Return proof waiting for ${order.orderNumber}`,
      text: `Order ${order.orderNumber} now has return proof waiting in the order detail.`,
      html: buildEditorialEmail({
        eyebrow: "Operations console",
        title: "Return proof waiting",
        subtitle: "Return proof is waiting for review.",
        reference: order.orderNumber,
        facts: [order.customerName, formatNgn(order.totalNgn)],
        action: "Review and continue.",
        cta: {
          label: "Open console",
          url: `${serverEnv.public.appUrl}/admin/orders/${order.orderId}`,
        },
      }),
    });
  }

  await sendAdminWorkspacePush({
    title: "Return proof waiting",
    body: `${order.customerName} added return proof for ${order.orderNumber}.`,
    href: buildAdminOrderLink(order.orderId),
    tag: `admin-return-${order.orderId}`,
  });
}

export async function sendOrderReturnDecisionNotification(input: {
  orderId: string;
  action: "approved" | "rejected" | "received";
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return;
  }

  const copy =
    input.action === "approved"
      ? {
          subject: `Return approved for ${order.orderNumber}`,
          title: "Return approved",
          intro: "Your return request is approved.",
          footer: "Refund can proceed after receipt.",
        }
      : input.action === "received"
        ? {
            subject: `Return received for ${order.orderNumber}`,
            title: "Return received",
            intro: "Your return is now received.",
            footer: "Refund can now be completed.",
          }
        : {
            subject: `Return update for ${order.orderNumber}`,
            title: "Return not approved",
            intro: "This return request could not be approved.",
            footer: undefined,
          };

  await sendSafe({
    to: customerEmail,
    subject: copy.subject,
    text: `${copy.title}. Order ${order.orderNumber}.`,
    html: buildOrderEditorial({
      eyebrow: "Returns",
      title: copy.title,
      subtitle: copy.intro,
      order,
      facts: buildOrderFactLines(order),
      action: input.note ?? undefined,
      footnote: copy.footer,
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: copy.title,
    body:
      input.action === "approved"
        ? `Return for #${order.orderNumber} is approved.`
        : input.action === "received"
          ? `Return for #${order.orderNumber} has been received.`
          : `Return for #${order.orderNumber} was not approved.`,
  });
}

export async function sendOrderRefundedNotification(input: {
  orderId: string;
  refundAmountNgn?: number | null;
  refundReference?: string | null;
  note?: string | null;
}) {
  const order = await loadOrder(input.orderId);

  if (!order) {
    return;
  }

  const customerEmail = await getSendableCustomerEmail(order);

  if (!customerEmail) {
    return;
  }

  await sendSafe({
    to: customerEmail,
    subject: `Refund sent for ${order.orderNumber}`,
    text: `Refund for order ${order.orderNumber} has been sent.`,
    html: buildOrderEditorial({
      eyebrow: "Refund",
      title: "Refund sent",
      subtitle: "Your refund is now in motion.",
      order,
      facts: [
        formatNgn(input.refundAmountNgn ?? order.totalNgn),
        input.refundReference ?? "Pending",
        ...(input.note ? [input.note] : []),
      ],
      action: "Keep this reference for your records.",
    }),
  });

  await sendCustomerWorkspacePush(order, {
    title: "Refund sent",
    body: `Refund for #${order.orderNumber} is on the way.`,
  });
}
