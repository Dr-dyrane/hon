import Link from "next/link";
import { AdminSettingsSectionNav } from "@/components/admin/settings/AdminSettingsSectionNav";
import { AdminTeamManager } from "@/components/admin/settings/AdminTeamManager";
import { requireAdminSession } from "@/lib/auth/guards";
import { listAdminUsers } from "@/lib/db/repositories/admin-user-repository";
import styles from "../settings-page.module.css";

type TeamTone = "idle" | "active" | "overloaded";

function resolveTeamTone(invitedCount: number, suspendedCount: number): TeamTone {
  if (suspendedCount > 0 || invitedCount >= 8) {
    return "overloaded";
  }

  if (invitedCount > 0) {
    return "active";
  }

  return "idle";
}

function getHeroState(input: {
  tone: TeamTone;
  invitedCount: number;
  suspendedCount: number;
}) {
  const { tone, invitedCount, suspendedCount } = input;

  if (tone === "overloaded") {
    return {
      title: "Team access needs attention.",
      detail:
        suspendedCount > 0
          ? `${suspendedCount} account${suspendedCount === 1 ? "" : "s"} are suspended. Resolve access state before queue handoffs are affected.`
          : `${invitedCount} pending invite${invitedCount === 1 ? "" : "s"} are waiting. Confirm role ownership before more operators are added.`,
      primaryActionHref:
        suspendedCount > 0
          ? "/admin/settings/team?scope=suspended#team-roster"
          : "/admin/settings/team?scope=invited#team-roster",
      primaryActionLabel: suspendedCount > 0 ? "Review suspended users" : "Process invites",
      pill: "Escalated team queue",
    };
  }

  if (tone === "active") {
    return {
      title: `${invitedCount} pending invite${invitedCount === 1 ? "" : "s"} in queue.`,
      detail:
        "Complete invite and role transitions so active operations stay staffed and predictable.",
      primaryActionHref: "/admin/settings/team?scope=invited#team-roster",
      primaryActionLabel: "Open invite queue",
      pill: "Invite queue active",
    };
  }

  return {
    title: "Team access is stable.",
    detail:
      "No pending invites or suspensions right now. Use this space for planned access updates.",
    primaryActionHref: "#team-roster",
    primaryActionLabel: "Open team roster",
    pill: "No pending access actions",
  };
}

function getWorkflowState(tone: TeamTone) {
  if (tone === "overloaded") {
    return {
      title: "Clear access blockers first.",
      detail:
        "Resolve suspended and invited users before making broader role adjustments.",
      badge: "Overload",
    };
  }

  if (tone === "active") {
    return {
      title: "Process invite queue.",
      detail:
        "Finalize pending team access and keep admin coverage balanced.",
      badge: "Active",
    };
  }

  return {
    title: "No immediate access queue.",
    detail:
      "Use this panel for staffing updates, policy checks, and operational continuity.",
    badge: "Stable",
  };
}

export default async function AdminSettingsTeamPage() {
  const session = await requireAdminSession("/admin/settings/team");
  const users = await listAdminUsers(50, session.email);
  const adminCount = users.filter((user) => user.isAdmin).length;
  const activeCount = users.filter((user) => user.status === "active").length;
  const invitedCount = users.filter((user) => user.status === "invited").length;
  const suspendedCount = users.filter((user) => user.status === "suspended").length;
  const tone = resolveTeamTone(invitedCount, suspendedCount);
  const heroState = getHeroState({ tone, invitedCount, suspendedCount });
  const workflowState = getWorkflowState(tone);
  const summary = `${invitedCount} invited - ${suspendedCount} suspended - ${adminCount} admins`;

  return (
    <div className={styles.page}>
      <section
        className={`${styles.hero} ${tone === "overloaded" ? styles.heroOverloaded : tone === "active" ? styles.heroActive : styles.heroIdle}`}
      >
        <p className={styles.heroEyebrow}>Team overview</p>
        <h1 className={styles.heroTitle}>{heroState.title}</h1>
        <p className={styles.heroDetail}>{heroState.detail}</p>

        <div className={styles.heroActions}>
          <Link href={heroState.primaryActionHref} className={styles.primaryAction}>
            {heroState.primaryActionLabel}
          </Link>
          <Link href="/admin/settings" className={styles.secondaryAction}>
            Open general settings
          </Link>
        </div>

        <div className={styles.activityPill}>{tone === "idle" ? heroState.pill : summary}</div>
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
            href="/admin/settings/team?scope=invited#team-roster"
            label="Invites"
            detail="Pending account onboarding"
            value={`${invitedCount}`}
            actionLabel="Review"
          />
          <QueueAction
            href="/admin/settings/team?scope=suspended#team-roster"
            label="Suspended"
            detail="Access currently paused"
            value={`${suspendedCount}`}
            actionLabel="Resolve"
          />
          <QueueAction
            href="/admin/settings/team?scope=admins#team-roster"
            label="Admins"
            detail="Privileged operators"
            value={`${adminCount}`}
            actionLabel="Audit"
          />
          <QueueAction
            href="#team-roster"
            label="Active"
            detail="Currently available operators"
            value={`${activeCount}`}
            actionLabel="Open"
          />
        </div>
      </section>

      <section id="team-roster" className={styles.surfaceSection}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Team roster</h2>
          <span className={styles.sectionCount}>{users.length} accounts</span>
        </header>

        <div className={styles.surfaceCard}>
          <AdminSettingsSectionNav />
          <AdminTeamManager users={users} />
        </div>
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
