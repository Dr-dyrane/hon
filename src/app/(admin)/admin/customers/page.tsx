import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/guards";
import { listAdminCustomerSummaries } from "@/lib/db/repositories/admin-repository";
import { formatFlowStatusLabel } from "@/lib/orders/presentation";
import styles from "./customers-page.module.css";

type CustomersTone = "idle" | "active" | "overloaded";
type CustomerSummary = Awaited<ReturnType<typeof listAdminCustomerSummaries>>[number];

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatusLabel(value?: string | null) {
  if (!value) {
    return null;
  }

  return formatFlowStatusLabel(value);
}

function formatSupportState(value: "standard" | "priority" | "follow_up" | "hold") {
  if (value === "follow_up") {
    return "Follow up";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isPriorityCustomer(customer: CustomerSummary) {
  return (
    customer.activeOrders > 0 ||
    customer.supportState !== "standard" ||
    Boolean(customer.notePreview)
  );
}

function resolveTone(priorityCount: number): CustomersTone {
  if (priorityCount >= 10) {
    return "overloaded";
  }

  if (priorityCount > 0) {
    return "active";
  }

  return "idle";
}

function getHeroState(input: {
  tone: CustomersTone;
  priorityCount: number;
  linkedCount: number;
  totalCount: number;
}) {
  const { tone, priorityCount, linkedCount, totalCount } = input;

  if (tone === "overloaded") {
    return {
      title: "Customer queue pressure is high.",
      detail: `${priorityCount} customer records need immediate attention. Clear active and flagged threads first.`,
      primaryActionHref: "#priority-customers",
      primaryActionLabel: "Open priority queue",
      pill: "Escalated customer queue",
    };
  }

  if (tone === "active") {
    return {
      title: `${priorityCount} customer thread${priorityCount === 1 ? "" : "s"} need attention.`,
      detail: "Work active orders and support flags before general account cleanup.",
      primaryActionHref: "#priority-customers",
      primaryActionLabel: "Review active threads",
      pill: "Priority queue active",
    };
  }

  if (totalCount > 0) {
    return {
      title: "Customer queue is stable.",
      detail: `${linkedCount} linked account${linkedCount === 1 ? "" : "s"} are synced with no active pressure right now.`,
      primaryActionHref: "#customer-archive",
      primaryActionLabel: "Open customer archive",
      pill: "No active pressure",
    };
  }

  return {
    title: "No customers yet.",
    detail: "Customer records appear once orders are created.",
    primaryActionHref: "/admin/orders",
    primaryActionLabel: "Open order board",
    pill: "Awaiting first customer",
  };
}

function getWorkflowState(input: {
  tone: CustomersTone;
}) {
  if (input.tone === "overloaded") {
    return {
      title: "Triage customer queue.",
      detail: "Resolve active orders and flagged CRM states before non-urgent profile work.",
      badge: "Overload",
      emptyDetail: "No priority customer threads right now. Continue profile and CRM quality passes.",
    };
  }

  if (input.tone === "active") {
    return {
      title: "Process priority threads.",
      detail: "Prioritize records with active orders, support holds, or follow-up notes.",
      badge: "Active",
      emptyDetail: "No priority customer threads right now. Continue profile and CRM quality passes.",
    };
  }

  return {
    title: "No priority queue.",
    detail: "You can focus on profile consistency and contact hygiene.",
    badge: "Clear",
    emptyDetail: "No priority customer threads right now. Continue profile and CRM quality passes.",
  };
}

export default async function AdminCustomersPage() {
  const session = await requireAdminSession("/admin/customers");
  const customers = await listAdminCustomerSummaries(80, session.email);

  const priorityCustomers = customers.filter(isPriorityCustomer);
  const archiveCustomers = customers.filter((customer) => !isPriorityCustomer(customer));

  const linkedCount = customers.filter((customer) => customer.userId).length;
  const guestCount = customers.length - linkedCount;
  const activeCount = customers.filter((customer) => customer.activeOrders > 0).length;
  const priorityCount = priorityCustomers.length;

  const tone = resolveTone(priorityCount);
  const heroState = getHeroState({
    tone,
    priorityCount,
    linkedCount,
    totalCount: customers.length,
  });
  const workflowState = getWorkflowState({ tone });
  const queueSummary = `${priorityCount} priority - ${linkedCount} linked - ${guestCount} guest`;

  return (
    <div className={styles.page}>
      <section
        className={`${styles.hero} ${tone === "overloaded" ? styles.heroOverloaded : tone === "active" ? styles.heroActive : styles.heroIdle}`}
      >
        <p className={styles.heroEyebrow}>Customers overview</p>
        <h1 className={styles.heroTitle}>{heroState.title}</h1>
        <p className={styles.heroDetail}>{heroState.detail}</p>

        <div className={styles.heroActions}>
          <Link href={heroState.primaryActionHref} className={styles.primaryAction}>
            {heroState.primaryActionLabel}
          </Link>
          <Link href="/admin/orders" className={styles.secondaryAction}>
            Open orders
          </Link>
        </div>

        <div className={styles.activityPill}>
          {tone === "idle" ? heroState.pill : queueSummary}
        </div>
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
          <QueueAction
            href="#priority-customers"
            label="Priority"
            detail="Active or flagged threads"
            value={`${priorityCount}`}
            actionLabel="Review"
          />
          <QueueAction
            href="#customer-archive"
            label="Linked"
            detail="Account-connected"
            value={`${linkedCount}`}
            actionLabel="Open"
          />
          <QueueAction
            href="#customer-archive"
            label="Active"
            detail="Live orders"
            value={`${activeCount}`}
            actionLabel="Track"
          />
        </div>
      </section>

      <section id="priority-customers" className={styles.queueSection}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Priority customers</h2>
          <span className={styles.sectionCount}>{priorityCount}</span>
        </header>

        {priorityCount === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>{workflowState.emptyDetail}</p>
            <div className={styles.emptyActions}>
              <Link href="#customer-archive" className={styles.emptyAction}>
                Open customer archive
              </Link>
              <Link href="/admin/orders" className={styles.emptyAction}>
                Open order board
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.cardGrid}>
            {priorityCustomers.map((customer) => (
              <CustomerCard
                key={customer.customerKey}
                customer={customer}
                priority
              />
            ))}
          </div>
        )}
      </section>

      <section id="customer-archive" className={styles.archiveSection}>
        {archiveCustomers.length === 0 ? (
          <div className={styles.emptyArchive}>No archived customer threads yet.</div>
        ) : (
          <details className={styles.archiveDisclosure} open={priorityCount === 0}>
            <summary className={styles.archiveSummary}>
              <span className={styles.archiveTitle}>Customer archive</span>
              <span className={styles.archiveBadge}>{archiveCustomers.length}</span>
            </summary>

            <div className={styles.archiveMetaRow}>
              <ArchiveMetaItem label="Visible" value={`${customers.length}`} />
              <ArchiveMetaItem label="Guest" value={`${guestCount}`} />
              <ArchiveMetaItem label="Linked" value={`${linkedCount}`} />
            </div>

            <div className={styles.cardGrid}>
              {archiveCustomers.map((customer) => (
                <CustomerCard key={customer.customerKey} customer={customer} />
              ))}
            </div>
          </details>
        )}
      </section>
    </div>
  );
}

function QueueAction({
  href,
  label,
  detail,
  value,
  actionLabel,
}: {
  href: string;
  label: string;
  detail: string;
  value: string;
  actionLabel: string;
}) {
  return (
    <Link href={href} className={styles.workflowAction}>
      <div className={styles.workflowActionMain}>
        <p className={styles.workflowActionLabel}>{label}</p>
        <p className={styles.workflowActionDetail}>{detail}</p>
      </div>
      <div className={styles.workflowActionSide}>
        <span className={styles.workflowActionValue}>{value}</span>
        <span className={styles.workflowActionMeta}>{actionLabel}</span>
      </div>
    </Link>
  );
}

function CustomerCard({
  customer,
  priority = false,
}: {
  customer: CustomerSummary;
  priority?: boolean;
}) {
  const displayName = customer.fullName ?? customer.email ?? customer.phone ?? "Unnamed";
  const customerStatus = formatStatusLabel(customer.latestOrderStatus);

  return (
    <article className={`${styles.card} ${priority ? styles.cardPriority : ""}`}>
      <div className={styles.cardHead}>
        <div className={styles.cardMain}>
          <p className={styles.cardName}>{displayName}</p>
          <div className={styles.tagRow}>
            <span className={styles.tag}>{customer.userId ? "Account" : "Guest"}</span>
            {customerStatus ? <span className={styles.tag}>{customerStatus}</span> : null}
            {customer.supportState !== "standard" ? (
              <span className={styles.tag}>{formatSupportState(customer.supportState)}</span>
            ) : null}
            {customer.tags.slice(0, 2).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <Link
          href={`/admin/customers/${encodeURIComponent(customer.customerKey)}`}
          className={styles.openAction}
        >
          Open
        </Link>
      </div>

      <div className={styles.metaGrid}>
        <MetaItem label="Email" value={customer.email ?? "No email"} />
        <MetaItem label="Phone" value={customer.phone ?? "No phone"} />
        <MetaItem label="Latest" value={customer.latestOrderNumber ?? "-"} />
        <MetaItem label="Seen" value={formatTimestamp(customer.latestOrderAt)} />
      </div>

      {customer.notePreview ? <p className={styles.note}>{customer.notePreview}</p> : null}

      <div className={styles.countGrid}>
        <CountPill label="Orders" value={customer.totalOrders} />
        <CountPill label="Active" value={customer.activeOrders} />
        <CountPill label="Places" value={customer.addressCount} />
      </div>
    </article>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaItem}>
      <p className={styles.metaLabel}>{label}</p>
      <p className={styles.metaValue}>{value}</p>
    </div>
  );
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.countPill}>
      <p className={styles.countValue}>{value}</p>
      <p className={styles.countLabel}>{label}</p>
    </div>
  );
}

function ArchiveMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.archiveMetaItem}>
      <p className={styles.archiveMetaLabel}>{label}</p>
      <p className={styles.archiveMetaValue}>{value}</p>
    </div>
  );
}
