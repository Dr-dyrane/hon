import { ScaffoldPage } from "@/components/shell/ScaffoldPage";

export default function AdminDeliveryPage() {
  return (
    <ScaffoldPage
      badge="Delivery"
      title="Dispatch board and live delivery supervision."
      description="This route is where Mapbox tracking, rider assignment, and delivery exception handling come together for operations."
      primaryAction={{ href: "/admin/orders", label: "Open Order Queue" }}
      summary={[
        {
          label: "Tracking",
          value: "Mapbox",
          detail: "Admin and customer tracking views will share one delivery data model.",
        },
        {
          label: "Rider Model",
          value: "Token Links",
          detail: "V1 delivery updates are planned around tokenized courier access rather than full rider accounts.",
        },
        {
          label: "Surface",
          value: "Map + Queue",
          detail: "The route is planned as a split board instead of a table-only admin screen.",
        },
      ]}
      sections={[
        {
          title: "Dispatch Flow",
          description: "The dispatcher needs to move quickly from ready order to active assignment.",
          items: [
            "Orders ready for dispatch",
            "Rider assignment action",
            "Pickup and delivery milestones",
          ],
        },
        {
          title: "Monitoring",
          description: "Live state should remain truthful even when location quality varies.",
          items: [
            "Location freshness and stale warnings",
            "Assignment status list",
            "Exception or failure handling",
          ],
        },
        {
          title: "Reuse",
          description: "The same underlying data will power customer tracking later.",
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
