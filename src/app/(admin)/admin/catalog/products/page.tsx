import Link from "next/link";
import { CatalogProductBoard } from "@/components/admin/catalog/CatalogProductBoard";
import { isStorefrontVisibleProduct } from "@/lib/catalog/storefront";
import { listAllAdminCatalogProducts } from "@/lib/db/repositories/catalog-admin-repository";
import styles from "../catalog-page.module.css";

type CatalogTone = "idle" | "active" | "overloaded";

function resolveCatalogTone(input: {
  totalProducts: number;
  liveProducts: number;
  draftProducts: number;
}): CatalogTone {
  const { totalProducts, liveProducts, draftProducts } = input;

  if (totalProducts === 0 || liveProducts === 0) {
    return "overloaded";
  }

  if (draftProducts > 0) {
    return "active";
  }

  return "idle";
}

function getHeroState(input: {
  tone: CatalogTone;
  totalProducts: number;
  draftProducts: number;
}) {
  const { tone, totalProducts, draftProducts } = input;

  if (tone === "overloaded") {
    if (totalProducts === 0) {
      return {
        title: "Catalog is empty.",
        detail:
          "No products are available yet. Create your first product before configuring taxonomy and layout placement.",
        primaryActionHref: "/admin/catalog/products/new",
        primaryActionLabel: "Create first product",
        pill: "No catalog entries",
      };
    }

    return {
      title: "No products are live.",
      detail:
        "Products exist but none are storefront-visible. Restore availability to reopen product-led conversion flow.",
      primaryActionHref: "#product-board",
      primaryActionLabel: "Open product board",
      pill: "Live catalog blocked",
    };
  }

  if (tone === "active") {
    return {
      title: `${draftProducts} draft product${draftProducts === 1 ? "" : "s"} need publishing.`,
      detail:
        "Finish pending product details and publish when pricing, media, and taxonomy are complete.",
      primaryActionHref: "#product-board",
      primaryActionLabel: "Review product drafts",
      pill: "Draft queue active",
    };
  }

  return {
    title: "Catalog is live and stable.",
    detail:
      "Storefront-visible products are active. Continue with merchandising and taxonomy tuning.",
    primaryActionHref: "#product-board",
    primaryActionLabel: "Open product board",
    pill: "Live catalog healthy",
  };
}

function getWorkflowState(tone: CatalogTone) {
  if (tone === "overloaded") {
    return {
      title: "Unblock live catalog flow.",
      detail:
        "Create or restore live products first, then tune category structure and merchandising.",
      badge: "Blocking",
    };
  }

  if (tone === "active") {
    return {
      title: "Process catalog publication queue.",
      detail:
        "Complete draft entries and align featured picks with current store narrative.",
      badge: "Active",
    };
  }

  return {
    title: "Catalog workflow is steady.",
    detail:
      "Use this board for merchandising changes and periodic content refreshes.",
    badge: "Stable",
  };
}

export default async function AdminProductsPage() {
  const products = await listAllAdminCatalogProducts();
  const liveProducts = products.filter((product) => isStorefrontVisibleProduct(product));
  const featuredProducts = products.filter(
    (product) => product.merchandisingState === "featured"
  );
  const draftProducts = products.filter((product) => product.status === "draft");
  const tone = resolveCatalogTone({
    totalProducts: products.length,
    liveProducts: liveProducts.length,
    draftProducts: draftProducts.length,
  });
  const heroState = getHeroState({
    tone,
    totalProducts: products.length,
    draftProducts: draftProducts.length,
  });
  const workflowState = getWorkflowState(tone);
  const summary = `${liveProducts.length} live - ${featuredProducts.length} featured - ${draftProducts.length} drafts`;

  return (
    <div className={styles.page}>
      <section
        className={`${styles.hero} ${tone === "overloaded" ? styles.heroOverloaded : tone === "active" ? styles.heroActive : styles.heroIdle}`}
      >
        <p className={styles.heroEyebrow}>Catalog products</p>
        <h1 className={styles.heroTitle}>{heroState.title}</h1>
        <p className={styles.heroDetail}>{heroState.detail}</p>

        <div className={styles.heroActions}>
          <Link href={heroState.primaryActionHref} className={styles.primaryAction}>
            {heroState.primaryActionLabel}
          </Link>
          <Link href="/admin/catalog/taxonomy" className={styles.secondaryAction}>
            Open taxonomy
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
            href="#product-board"
            label="Products"
            detail="Total catalog entries"
            value={`${products.length}`}
            actionLabel="Open"
          />
          <QueueAction
            href="#product-board"
            label="Live"
            detail="Storefront visible"
            value={`${liveProducts.length}`}
            actionLabel="Review"
          />
          <QueueAction
            href="#product-board"
            label="Featured"
            detail="Promoted on home"
            value={`${featuredProducts.length}`}
            actionLabel="Tune"
          />
          <QueueAction
            href="/admin/catalog/products/new"
            label="Drafts"
            detail="Pending publication"
            value={`${draftProducts.length}`}
            actionLabel="Create"
          />
        </div>
      </section>

      <section id="product-board" className={styles.surfaceSection}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Product board</h2>
          <span className={styles.sectionCount}>{products.length} total</span>
        </header>

        <div className={styles.surfaceCard}>
          <div className={styles.contextActions}>
            <Link href="/admin/catalog/products/new" className={styles.primaryAction}>
              New product
            </Link>
            <Link href="/admin/catalog/taxonomy" className={styles.contextAction}>
              Taxonomy
            </Link>
            <Link href="/admin/layout" className={styles.contextAction}>
              Layout
            </Link>
          </div>

          <CatalogProductBoard products={products} />
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
