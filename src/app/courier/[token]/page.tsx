import { CourierTracker } from "@/components/delivery/CourierTracker";
import { getCourierSessionByToken } from "@/lib/db/repositories/delivery-repository";

export default async function CourierPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getCourierSessionByToken(token);

  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-10">
        <div className="w-full rounded-[32px] bg-system-background/88 p-6 text-sm text-secondary-label shadow-[0_28px_90px_rgba(15,23,42,0.08)]">
          Courier link unavailable.
        </div>
      </div>
    );
  }

  return <CourierTracker token={token} session={session} />;
}
