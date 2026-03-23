import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCustomerCRM } from "@/components/admin/customers/AdminCustomerCRM";
import { requireAdminSession } from "@/lib/auth/guards";
import { getAdminCustomerDetail } from "@/lib/db/repositories/admin-repository";
import { formatFlowStatusLabel } from "@/lib/orders/presentation";
import styles from "./customer-detail-page.module.css";

type CustomerTone = "idle" | "watch" | "active";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSupportState(value: "standard" | "priority" | "follow_up" | "hold") {
  if (value === "follow_up") {
    return "Follow up";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function resolveTone(input: {
  activeOrders: number;
  supportState: "standard" | "priority" | "follow_up" | "hold";
}) {
  const { activeOrders, supportState } = input;

  if (activeOrders >= 3 || supportState === "priority") {
    return "active" satisfies CustomerTone;
  }

  if (activeOrders > 0 || supportState !== "standard") {
    return "watch" satisfies CustomerTone;
  }

  return "idle" satisfies CustomerTone;
}

function getHeroState(input: {
  tone: CustomerTone;
  activeOrders: number;
  supportState: "standard" | "priority" | "follow_up" | "hold";
}) {
  const { tone, activeOrders, supportState } = input;

  if (tone === "active") {
    return {
      title: `${activeOrders} live order${activeOrders === 1 ? "" : "s"} need attention.`,
      detail: "Keep payment, fulfillment, and CRM notes aligned for this customer thread.",
      pill: "Active customer thread",
    };
  }

  if (tone === "watch") {
    return {
      title: "Customer thread is in motion.",
      detail:
        supportState !== "standard"
          ? `Support state is ${formatSupportState(supportState).toLowerCase()}. Keep follow-up actions explicit.`
          : "Monitor recent order activity and keep contact details current.",
      pill: "Watch list",
    };
  }

  return {
    title: "Customer profile is steady.",
    detail: "No active queue pressure right now. Use this view for profile and CRM upkeep.",
    pill: "Stable thread",
  };
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ customerKey: string }>;
}) {
  const session = await requireAdminSession("/admin/customers");
  const { customerKey } = await params;
  const customer = await getAdminCustomerDetail(
    decodeURIComponent(customerKey),
    session.email
  );

  if (!customer) {
    notFound();
  }

  const tone = resolveTone({
    activeOrders: customer.activeOrders,
    supportState: customer.supportState,
  });
  const heroState = getHeroState({
    tone,
    activeOrders: customer.activeOrders,
    supportState: customer.supportState,
  });

  const displayName = customer.fullName ?? customer.email ?? customer.phone ?? "Customer";
  const latestOrder = customer.recentOrders[0] ?? null;
  const latestStatus = customer.latestOrderStatus
    ? formatFlowStatusLabel(customer.latestOrderStatus)
    : null;

  return (
    <div className={styles.page}>
      <section
        className={`${styles.hero} ${tone === "active" ? styles.heroActive : tone === "watch" ? styles.heroWatch : styles.heroIdle}`}
      >
        <p className={styles.heroEyebrow}>Customer detail</p>
        <p className={styles.heroIdentity}>{displayName}</p>
        <h1 className={styles.heroTitle}>{heroState.title}</h1>
        <p className={styles.heroDetail}>{heroState.detail}</p>

        <div className={styles.heroActions}>
          {latestOrder ? (
            <Link href={`/admin/orders/${latestOrder.orderId}`} className={styles.primaryAction}>
              Open latest order
            </Link>
          ) : (
            <Link href="/admin/orders" className={styles.primaryAction}>
              Open order board
            </Link>
          )}
          <Link href="#crm-panel" className={styles.secondaryAction}>
            Open CRM
          </Link>
        </div>

        <div className={styles.activityPill}>{heroState.pill}</div>
      </section>

      <section
        className={`${styles.primaryWorkflow} ${tone === "active" ? styles.workflowActive : tone === "watch" ? styles.workflowWatch : styles.workflowIdle}`}
      >
        <div className={styles.workflowHead}>
          <div>
            <p className={styles.panelEyebrow}>Primary workflow</p>
            <h2 className={styles.workflowTitle}>
              {customer.activeOrders > 0 ? "Handle live order + CRM context." : "Maintain customer readiness."}
            </h2>
            <p className={styles.workflowDetail}>
              {customer.activeOrders > 0
                ? "Review latest order status, then update support notes and delivery places in one pass."
                : "Keep profile, contact details, and support state current for upcoming orders."}
            </p>
          </div>
          <span className={styles.workflowBadge}>{tone === "active" ? "Active" : tone === "watch" ? "Watch" : "Clear"}</span>
        </div>

        <div className={styles.workflowActionGrid}>
          <WorkflowAction
            href={latestOrder ? `/admin/orders/${latestOrder.orderId}` : "/admin/orders"}
            label="Latest order"
            detail={latestOrder ? latestOrder.orderNumber : "No orders yet"}
            meta="Open"
          />
          <WorkflowAction
            href="/admin/customers"
            label="Customer board"
            detail="Return to queue"
            meta="Board"
          />
          <WorkflowAction
            href="#crm-panel"
            label="CRM controls"
            detail="Support, profile, addresses"
            meta="Edit"
          />
        </div>

        <div className={styles.readinessStrip}>
          <p className={styles.readinessLabel}>Thread signals</p>
          <div className={styles.readinessChipRow}>
            <span className={styles.readinessChip}>{customer.userId ? "Account" : "Guest"}</span>
            <span className={styles.readinessChip}>{formatSupportState(customer.supportState)}</span>
            <span className={styles.readinessChip}>{customer.addressCount} places</span>
            {latestStatus ? <span className={styles.readinessChip}>{latestStatus}</span> : null}
          </div>
        </div>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.ordersPanel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Recent orders</h2>
            <span className={styles.panelBadge}>{customer.recentOrders.length}</span>
          </div>

          <div className={styles.orderList}>
            {customer.recentOrders.length === 0 ? (
              <div className={styles.emptyOrders}>No orders yet.</div>
            ) : (
              customer.recentOrders.map((order) => (
                <Link
                  key={order.orderId}
                  href={`/admin/orders/${order.orderId}`}
                  className={styles.orderCard}
                >
                  <div className={styles.orderCardHead}>
                    <div>
                      <p className={styles.orderLabel}>Order</p>
                      <p className={styles.orderNumber}>{order.orderNumber}</p>
                    </div>
                    <p className={styles.orderAmount}>{formatCurrency(order.totalNgn)}</p>
                  </div>

                  <div className={styles.orderMetaRow}>
                    <span className={styles.orderMeta}>{formatFlowStatusLabel(order.status)}</span>
                    <span className={styles.orderMeta}>{order.itemCount} items</span>
                    <span className={styles.orderMeta}>{formatTimestamp(order.placedAt)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section id="crm-panel" className={styles.crmPanel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>CRM panel</h2>
            <span className={styles.panelBadge}>Live</span>
          </div>
          <p className={styles.crmDetail}>
            Manage support state, contact profile, and delivery places for this customer thread.
          </p>

          <AdminCustomerCRM customer={customer} />
        </section>
      </div>
    </div>
  );
}

function WorkflowAction({
  href,
  label,
  detail,
  meta,
}: {
  href: string;
  label: string;
  detail: string;
  meta: string;
}) {
  return (
    <Link href={href} className={styles.workflowAction}>
      <div className={styles.workflowActionMain}>
        <p className={styles.workflowActionLabel}>{label}</p>
        <p className={styles.workflowActionDetail}>{detail}</p>
      </div>
      <span className={styles.workflowActionMeta}>{meta}</span>
    </Link>
  );
}
