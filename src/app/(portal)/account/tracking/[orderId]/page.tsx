import { ScaffoldPage } from "@/components/shell/ScaffoldPage";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <ScaffoldPage
      badge="Tracking"
      title={`Tracking ${orderId}`}
      description="This route is reserved for the Mapbox-first delivery experience: rider position, ETA, timeline, and freshness state. It is now present as the stable signed-in tracking destination."
      primaryAction={{ href: "/account/orders", label: "Back To Orders" }}
      summary={[
        {
          label: "Map Surface",
          value: "Mapbox",
          detail: "Customer tracking will reuse the same location domain model as admin dispatch.",
        },
        {
          label: "Realtime",
          value: "SSE / Polling",
          detail: "We start with lighter live updates before introducing sockets.",
        },
        {
          label: "Safety",
          value: "Scoped",
          detail: "Only the owner or a tokenized guest flow can access tracking state.",
        },
      ]}
      sections={[
        {
          title: "Tracking Data",
          description: "The customer view should stay minimal while still trustworthy.",
          items: [
            "Latest rider position",
            "ETA and last updated time",
            "Milestone timeline for delivery progress",
          ],
        },
        {
          title: "Failure Handling",
          description: "The UI needs to degrade honestly if live data goes stale.",
          items: [
            "Location freshness indicator",
            "Delay or exception messaging",
            "Fallback to milestone-only state if map data is stale",
          ],
        },
        {
          title: "Shared Model",
          description: "This route will be fed by the same delivery assignment and tracking tables used in admin.",
          items: [
            "delivery_assignments",
            "delivery_events",
            "tracking_points",
          ],
        },
      ]}
    />
  );
}
