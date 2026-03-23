import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { PortalProfileForm } from "@/components/account/PortalProfileForm";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { getPortalProfile } from "@/lib/db/repositories/account-repository";
import styles from "./profile-page.module.css";

function countMissingProfileFields(input: {
  fullName: string;
  preferredPhoneE164: string;
  firstName: string;
  lastName: string;
}) {
  return [
    input.fullName.trim().length === 0,
    input.preferredPhoneE164.trim().length === 0,
    input.firstName.trim().length === 0,
    input.lastName.trim().length === 0,
  ].filter(Boolean).length;
}

export default async function ProfilePage() {
  const session = await requireAuthenticatedSession("/account/profile");
  const profile = await getPortalProfile(session.email);
  const missingFieldCount = countMissingProfileFields(profile);
  const enabledAlertChannels = [
    profile.workspaceEmailEnabled,
    profile.workspaceInAppEnabled,
    profile.workspacePushEnabled,
  ].filter(Boolean).length;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <p className={styles.heroEyebrow}>Profile</p>
          <SignOutButton />
        </div>
        <h1 className={styles.heroTitle}>{profile.fullName || "Your profile"}</h1>
        <p className={styles.heroDetail}>
          {missingFieldCount > 0
            ? `${missingFieldCount} field${missingFieldCount === 1 ? "" : "s"} still missing.`
            : "Identity details are complete."}
        </p>

        <div className={styles.heroActions}>
          <Link href="/account/profile#account-profile-form" className={styles.primaryAction}>
            Complete profile
          </Link>
          <Link href="/account/addresses" className={styles.secondaryAction}>
            Manage places
          </Link>
        </div>

        <div className={styles.activityPill}>
          {enabledAlertChannels} alert channel{enabledAlertChannels === 1 ? "" : "s"} on
        </div>
      </section>

      <section className={styles.workflow}>
        <div className={styles.workflowHead}>
          <div>
            <p className={styles.panelEyebrow}>Primary workflow</p>
            <h2 className={styles.workflowTitle}>
              {missingFieldCount > 0 ? "Finish identity setup." : "Profile is ready."}
            </h2>
            <p className={styles.workflowDetail}>
              {missingFieldCount > 0
                ? "Complete identity and phone details before your next checkout."
                : "Review notification preferences to match how you want updates delivered."}
            </p>
          </div>
          <span className={styles.workflowBadge}>
            {missingFieldCount > 0 ? "Needs update" : "Complete"}
          </span>
        </div>

        <div className={styles.workflowActionGrid}>
          <Link href="/account/profile#account-profile-form" className={styles.workflowAction}>
            <span className={styles.surfaceActionLabel}>Open editor</span>
            <span className={styles.surfaceActionMeta}>Edit</span>
          </Link>
          <Link href="/account/orders" className={styles.workflowAction}>
            <span className={styles.surfaceActionLabel}>View order flow</span>
            <span className={styles.surfaceActionMeta}>Open</span>
          </Link>
        </div>
      </section>

      <section className={styles.formSection}>
        <PortalProfileForm profile={profile} />
      </section>
    </div>
  );
}

