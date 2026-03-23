import Link from "next/link";
import { TaxonomyBoard } from "@/components/admin/catalog/TaxonomyBoard";
import { requireAdminSession } from "@/lib/auth/guards";
import {
  listAdminCatalogCategoryDetails,
  listAdminCatalogIngredients,
} from "@/lib/db/repositories/catalog-admin-repository";
import styles from "../catalog-page.module.css";

type TaxonomyTone = "idle" | "active" | "overloaded";

function resolveTaxonomyTone(input: {
  totalEntries: number;
  unlinkedEntries: number;
}): TaxonomyTone {
  const { totalEntries, unlinkedEntries } = input;

  if (totalEntries === 0) {
    return "overloaded";
  }

  if (unlinkedEntries > 0) {
    return "active";
  }

  return "idle";
}

function getHeroState(input: {
  tone: TaxonomyTone;
  unlinkedEntries: number;
}) {
  const { tone, unlinkedEntries } = input;

  if (tone === "overloaded") {
    return {
      title: "Taxonomy has no entries.",
      detail:
        "Categories and ingredients are empty. Seed taxonomy before scaling product publishing.",
      primaryActionHref: "/admin/catalog/taxonomy/new",
      primaryActionLabel: "Create taxonomy entry",
      pill: "No taxonomy structure",
    };
  }

  if (tone === "active") {
    return {
      title: `${unlinkedEntries} taxonomy entr${unlinkedEntries === 1 ? "y is" : "ies are"} unlinked.`,
      detail:
        "Link loose entries to products so discovery, filters, and ingredient storytelling stay coherent.",
      primaryActionHref: "#taxonomy-board",
      primaryActionLabel: "Review taxonomy board",
      pill: "Linkage cleanup active",
    };
  }

  return {
    title: "Taxonomy structure is stable.",
    detail:
      "Categories and ingredients are linked. Use this board for controlled expansion.",
    primaryActionHref: "#taxonomy-board",
    primaryActionLabel: "Open taxonomy board",
    pill: "Taxonomy aligned",
  };
}

function getWorkflowState(tone: TaxonomyTone) {
  if (tone === "overloaded") {
    return {
      title: "Seed taxonomy foundations.",
      detail:
        "Create core categories and ingredients before publishing additional product variants.",
      badge: "Blocking",
    };
  }

  if (tone === "active") {
    return {
      title: "Resolve taxonomy linkage gaps.",
      detail:
        "Map unlinked entries to products and variants before adding new catalog complexity.",
      badge: "Active",
    };
  }

  return {
    title: "Taxonomy workflow is steady.",
    detail:
      "Use this board for routine taxonomy maintenance and expansion planning.",
    badge: "Stable",
  };
}

export default async function AdminCatalogTaxonomyPage() {
  await requireAdminSession("/admin/catalog/taxonomy");
  const [categories, ingredients] = await Promise.all([
    listAdminCatalogCategoryDetails(),
    listAdminCatalogIngredients(),
  ]);

  const linkedCategories = categories.filter(
    (category) => category.productCount > 0
  ).length;
  const linkedIngredients = ingredients.filter(
    (ingredient) => ingredient.variantCount > 0
  ).length;
  const totalEntries = categories.length + ingredients.length;
  const unlinkedEntries =
    categories.length - linkedCategories + (ingredients.length - linkedIngredients);
  const tone = resolveTaxonomyTone({ totalEntries, unlinkedEntries });
  const heroState = getHeroState({ tone, unlinkedEntries });
  const workflowState = getWorkflowState(tone);
  const summary = `${categories.length} categories - ${ingredients.length} ingredients - ${unlinkedEntries} unlinked`;

  return (
    <div className={styles.page}>
      <section
        className={`${styles.hero} ${tone === "overloaded" ? styles.heroOverloaded : tone === "active" ? styles.heroActive : styles.heroIdle}`}
      >
        <p className={styles.heroEyebrow}>Catalog taxonomy</p>
        <h1 className={styles.heroTitle}>{heroState.title}</h1>
        <p className={styles.heroDetail}>{heroState.detail}</p>

        <div className={styles.heroActions}>
          <Link href={heroState.primaryActionHref} className={styles.primaryAction}>
            {heroState.primaryActionLabel}
          </Link>
          <Link href="/admin/catalog/products" className={styles.secondaryAction}>
            Open products
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
            href="#taxonomy-board"
            label="Categories"
            detail="Top-level product grouping"
            value={`${categories.length}`}
            actionLabel="Review"
          />
          <QueueAction
            href="#taxonomy-board"
            label="Ingredients"
            detail="Variant ingredient mapping"
            value={`${ingredients.length}`}
            actionLabel="Review"
          />
          <QueueAction
            href="#taxonomy-board"
            label="Unlinked"
            detail="Not attached to products"
            value={`${unlinkedEntries}`}
            actionLabel="Resolve"
          />
          <QueueAction
            href="/admin/catalog/taxonomy/new"
            label="New entry"
            detail="Create category or ingredient"
            value={`${totalEntries}`}
            actionLabel="Create"
          />
        </div>
      </section>

      <section id="taxonomy-board" className={styles.surfaceSection}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Taxonomy board</h2>
          <span className={styles.sectionCount}>{totalEntries} entries</span>
        </header>

        <div className={styles.surfaceCard}>
          <div className={styles.contextActions}>
            <Link href="/admin/catalog/taxonomy/new" className={styles.primaryAction}>
              New entry
            </Link>
            <Link href="/admin/catalog/products" className={styles.contextAction}>
              Products
            </Link>
            <Link href="/admin/layout" className={styles.contextAction}>
              Layout
            </Link>
          </div>

          <TaxonomyBoard categories={categories} ingredients={ingredients} />
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
