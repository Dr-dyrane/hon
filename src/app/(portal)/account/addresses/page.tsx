import Link from "next/link";
import { AddressBook } from "@/components/account/AddressBook";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { listPortalAddresses } from "@/lib/db/repositories/account-repository";
import styles from "./addresses-page.module.css";

function formatAddressSummary(input: {
  line1: string;
  city: string;
  state: string;
}) {
  const location = [input.city, input.state].filter(Boolean).join(", ");

  if (!location) {
    return input.line1;
  }

  return `${input.line1} - ${location}`;
}

export default async function AddressesPage() {
  const session = await requireAuthenticatedSession("/account/addresses");
  const addresses = await listPortalAddresses(session.email);
  const hasAddresses = addresses.length > 0;
  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
  const activitySummary = hasAddresses
    ? `${addresses.length} saved ${addresses.length === 1 ? "place" : "places"}`
    : "No saved places yet";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>Address book</p>
        <h1 className={styles.heroTitle}>
          {hasAddresses ? "Delivery places are ready." : "Add your first delivery place."}
        </h1>
        <p className={styles.heroDetail}>
          {hasAddresses
            ? "Keep one default address and update details before checkout."
            : "Set up one place now so checkout and delivery stay fast."}
        </p>

        <div className={styles.heroActions}>
          <Link
            href="/account/addresses#account-address-form"
            className={styles.primaryAction}
          >
            {hasAddresses ? "Add or edit place" : "Add first place"}
          </Link>
          <Link href="/account/profile" className={styles.secondaryAction}>
            Open profile
          </Link>
        </div>

        <div className={styles.activityPill}>{activitySummary}</div>
      </section>

      <section className={styles.workflow}>
        <div className={styles.workflowHead}>
          <div>
            <p className={styles.panelEyebrow}>Primary workflow</p>
            <h2 className={styles.workflowTitle}>
              {defaultAddress ? defaultAddress.label : "No place set"}
            </h2>
            <p className={styles.workflowDetail}>
              {defaultAddress
                ? formatAddressSummary(defaultAddress)
                : "Start by adding a delivery address."}
            </p>
          </div>
          <span className={styles.workflowBadge}>
            {defaultAddress?.isDefault ? "Default" : hasAddresses ? "Saved" : "Setup"}
          </span>
        </div>

        <div className={styles.workflowActionGrid}>
          <Link href="/account/addresses#account-address-form" className={styles.workflowAction}>
            <span className={styles.surfaceActionLabel}>Open editor</span>
            <span className={styles.surfaceActionMeta}>Edit</span>
          </Link>
          <Link href="/account/orders" className={styles.workflowAction}>
            <span className={styles.surfaceActionLabel}>Check order flow</span>
            <span className={styles.surfaceActionMeta}>Open</span>
          </Link>
        </div>
      </section>

      <section className={styles.bookSection}>
        <AddressBook addresses={addresses} />
      </section>
    </div>
  );
}

