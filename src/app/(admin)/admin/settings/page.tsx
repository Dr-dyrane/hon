import Link from "next/link";
import { AdminSettingsSectionNav } from "@/components/admin/settings/AdminSettingsSectionNav";
import { requireAdminSession } from "@/lib/auth/guards";
import { AdminSettingsEditor } from "@/components/admin/settings/AdminSettingsEditor";
import { getAdminSettingsSnapshot } from "@/lib/db/repositories/settings-repository";
import { getWorkspaceNotificationPreference } from "@/lib/db/repositories/notification-preferences-repository";
import styles from "./settings-page.module.css";

type SettingsTone = "idle" | "active" | "overloaded";

function formatPreviewMode(mode: string) {
  return mode.replace(/_/g, " ");
}

function resolveSettingsTone(input: {
  hasBankAccount: boolean;
  trackingEnabled: boolean;
  notificationsEnabled: boolean;
}): SettingsTone {
  const { hasBankAccount, trackingEnabled, notificationsEnabled } = input;

  if (!hasBankAccount) {
    return "overloaded";
  }

  if (!trackingEnabled || !notificationsEnabled) {
    return "active";
  }

  return "idle";
}

function getHeroState(input: {
  tone: SettingsTone;
  hasBankAccount: boolean;
  trackingEnabled: boolean;
  notificationsEnabled: boolean;
}) {
  const { tone, hasBankAccount, trackingEnabled, notificationsEnabled } = input;

  if (tone === "overloaded") {
    return {
      title: "Transfer setup is incomplete.",
      detail:
        "Bank details are missing. Add payout information before payout and review operations stall.",
      primaryActionHref: "#bank-settings",
      primaryActionLabel: "Set bank details",
      pill: "Blocking configuration",
    };
  }

  if (tone === "active") {
    return {
      title: "Settings need a quick tune.",
      detail:
        "Core controls are live, but delivery tracking or operator notifications need alignment.",
      primaryActionHref: !trackingEnabled
        ? "#delivery-settings"
        : "#notification-settings",
      primaryActionLabel: !trackingEnabled
        ? "Fix delivery defaults"
        : "Adjust notifications",
      pill: "Configuration in progress",
    };
  }

  return {
    title: "Operations settings are aligned.",
    detail:
      "Bank, delivery defaults, and operator notifications are ready for daily flow.",
    primaryActionHref: "/admin/settings/team",
    primaryActionLabel: "Open team settings",
    pill: hasBankAccount && notificationsEnabled ? "All systems clear" : "Settings ready",
  };
}

function getWorkflowState(tone: SettingsTone) {
  if (tone === "overloaded") {
    return {
      title: "Complete blocking setup first.",
      detail:
        "Finalize transfer defaults before tuning delivery and notification behavior.",
      badge: "Blocking",
    };
  }

  if (tone === "active") {
    return {
      title: "Resolve remaining configuration gaps.",
      detail:
        "Update delivery and notification controls so operators get consistent signals.",
      badge: "Active",
    };
  }

  return {
    title: "Configuration is stable.",
    detail:
      "Use this space for periodic tuning and policy updates as operations evolve.",
    badge: "Stable",
  };
}

export default async function AdminSettingsPage() {
  const session = await requireAdminSession("/admin/settings");
  const [snapshot, notificationPreference] = await Promise.all([
    getAdminSettingsSnapshot(),
    getWorkspaceNotificationPreference(session.email),
  ]);

  const hasBankAccount = Boolean(
    snapshot.bankAccount?.bankName &&
      snapshot.bankAccount.accountName &&
      snapshot.bankAccount.accountNumber
  );
  const trackingEnabled = snapshot.deliveryDefaults.trackingEnabled;
  const notificationsEnabled =
    notificationPreference.workspaceEmailEnabled ||
    notificationPreference.workspaceInAppEnabled ||
    notificationPreference.workspacePushEnabled;
  const tone = resolveSettingsTone({
    hasBankAccount,
    trackingEnabled,
    notificationsEnabled,
  });
  const heroState = getHeroState({
    tone,
    hasBankAccount,
    trackingEnabled,
    notificationsEnabled,
  });
  const workflowState = getWorkflowState(tone);
  const summary = `${hasBankAccount ? "bank ready" : "bank pending"} - tracking ${trackingEnabled ? "on" : "off"} - notifications ${notificationsEnabled ? "on" : "off"}`;

  return (
    <div className={styles.page}>
      <section
        className={`${styles.hero} ${tone === "overloaded" ? styles.heroOverloaded : tone === "active" ? styles.heroActive : styles.heroIdle}`}
      >
        <p className={styles.heroEyebrow}>Settings overview</p>
        <h1 className={styles.heroTitle}>{heroState.title}</h1>
        <p className={styles.heroDetail}>{heroState.detail}</p>

        <div className={styles.heroActions}>
          <Link href={heroState.primaryActionHref} className={styles.primaryAction}>
            {heroState.primaryActionLabel}
          </Link>
          <Link href="/admin/settings/team" className={styles.secondaryAction}>
            Open team
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
            href="#bank-settings"
            label="Bank"
            detail={snapshot.bankAccount?.bankName ?? "Transfer default account"}
            value={hasBankAccount ? "ready" : "pending"}
            actionLabel="Manage"
          />
          <QueueAction
            href="#delivery-settings"
            label="Delivery"
            detail="Tracking and stale-window policy"
            value={`${snapshot.deliveryDefaults.staleTransferWindowMinutes}m`}
            actionLabel={trackingEnabled ? "Tune" : "Fix"}
          />
          <QueueAction
            href="#notification-settings"
            label="Notifications"
            detail="Operator alerts across channels"
            value={notificationsEnabled ? "on" : "off"}
            actionLabel="Update"
          />
          <QueueAction
            href="#preview-settings"
            label="Preview"
            detail="Layout review mode"
            value={formatPreviewMode(snapshot.layoutPreview.mode)}
            actionLabel="Switch"
          />
        </div>
      </section>

      <section id="settings-surfaces" className={styles.surfaceSection}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Settings surfaces</h2>
          <span className={styles.sectionCount}>4 panels</span>
        </header>

        <div className={styles.surfaceCard}>
          <AdminSettingsSectionNav />
          <AdminSettingsEditor
            bankAccount={snapshot.bankAccount}
            deliveryDefaults={snapshot.deliveryDefaults}
            layoutPreview={snapshot.layoutPreview}
            notificationPreference={notificationPreference}
          />
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
