import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/guards";
import { formatNgn } from "@/lib/commerce";
import { listPaymentsForAdmin } from "@/lib/db/repositories/orders-repository";

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function PaymentStatusChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-system-fill/70 px-3 py-1 text-[11px] font-semibold tracking-tight text-secondary-label">
      {label}
    </span>
  );
}

export default async function AdminPaymentsPage() {
  await requireAdminSession("/admin/payments");
  const payments = await listPaymentsForAdmin(50);
  const underReview = payments.filter((payment) => payment.status === "under_review").length;
  const submitted = payments.filter((payment) => payment.status === "submitted").length;

  return (
    <div className="space-y-8">
      <section className="glass-morphism rounded-[36px] bg-system-background/86 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
        <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
          Payments
        </p>
        <h2 className="text-3xl font-bold tracking-display text-label">
          Transfer review queue
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-secondary-label">
          Focus on submitted transfers and bank confirmations before marking an order ready for
          dispatch.
        </p>

        <div className="mt-6 grid gap-4 xl:grid-cols-3">
          <article className="rounded-[28px] bg-system-fill/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
              Under review
            </p>
            <p className="mt-2 text-4xl font-semibold text-label">{underReview}</p>
            <p className="text-xs leading-snug text-secondary-label">Need explicit approval.</p>
          </article>
          <article className="rounded-[28px] bg-system-fill/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
              Submitted
            </p>
            <p className="mt-2 text-4xl font-semibold text-label">{submitted}</p>
            <p className="text-xs leading-snug text-secondary-label">
              Awaiting proof or match.
            </p>
          </article>
          <article className="rounded-[28px] bg-system-fill/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
              Queue
            </p>
            <p className="mt-2 text-4xl font-semibold text-label">{payments.length}</p>
            <p className="text-xs leading-snug text-secondary-label">
              Showing most recent 50 payments.
            </p>
          </article>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
              Bank transfers
            </p>
            <h3 className="text-2xl font-semibold tracking-title text-label">
              Proofs and review notes
            </h3>
          </div>
          <div className="text-sm text-secondary-label">
            Payments stay tied to orders until marked confirmed or rejected.
          </div>
        </div>

        <div className="grid gap-4">
          {payments.map((payment) => (
            <article
              key={payment.paymentId}
              className="glass-morphism rounded-[32px] bg-system-background/72 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold tracking-headline text-secondary-label uppercase">
                    Payment for {payment.orderNumber}
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-label">
                    {formatNgn(payment.expectedAmountNgn)}
                  </p>
                </div>
                <PaymentStatusChip label={payment.status.replace(/_/g, " ")} />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm text-secondary-label">
                  <p>
                    <span className="font-semibold text-label">Bank account</span>
                    <br />
                    {payment.bankName ?? "N/A"} · {payment.accountName ?? "N/A"} ·
                    {payment.accountNumber ?? "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold text-label">Payer</span>
                    <br />
                    {payment.payerName ?? "Missing proof"}
                  </p>
                  <p>
                    <span className="font-semibold text-label">Submitted</span>
                    <br />
                    {formatTimestamp(payment.submittedAt)}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-secondary-label">
                  <p>
                    <span className="font-semibold text-label">Expected</span>
                    <br />
                    {formatNgn(payment.expectedAmountNgn)}
                  </p>
                  <p>
                    <span className="font-semibold text-label">Received</span>
                    <br />
                    {payment.submittedAmountNgn !== null
                      ? formatNgn(payment.submittedAmountNgn)
                      : "Awaiting proof"}
                  </p>
                  <p>
                    <span className="font-semibold text-label">Expires</span>
                    <br />
                    {formatTimestamp(payment.expiresAt)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Link
                  href="/admin/orders"
                  className="text-xs font-semibold uppercase tracking-headline text-secondary-label underline-offset-4 hover:text-label"
                >
                  Back to orders
                </Link>
                <span className="text-xs font-semibold uppercase tracking-headline text-secondary-label">
                  Payment ID {payment.paymentId}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
