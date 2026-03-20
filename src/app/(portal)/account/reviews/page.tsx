import { ScaffoldPage } from "@/components/shell/ScaffoldPage";

export default function ReviewsPage() {
  return (
    <ScaffoldPage
      badge="Reviews"
      title="Pending ratings and submitted feedback."
      description="Reviews are customer trust signals and operational feedback. This route will handle the post-delivery review lifecycle while keeping moderation in admin."
      primaryAction={{ href: "/account/orders", label: "Open Orders" }}
      summary={[
        {
          label: "Policy",
          value: "Pre-Moderated",
          detail: "New reviews remain moderated before becoming visible as trust content.",
        },
        {
          label: "Eligibility",
          value: "Delivered Only",
          detail: "Domain rules block review attempts before successful delivery.",
        },
        {
          label: "Model",
          value: "One Per Order",
          detail: "Each delivered order maps to one canonical review unless edits are explicitly added later.",
        },
      ]}
      sections={[
        {
          title: "Customer Experience",
          description: "The flow should stay short and respectful.",
          items: [
            "Pending review requests list",
            "Star-first input model",
            "Optional text feedback",
          ],
        },
        {
          title: "Admin Relationship",
          description: "This route feeds the moderation queue and later homepage bindings.",
          items: [
            "Review requests created on delivery",
            "Moderation in admin",
            "Featured review eligibility after approval",
          ],
        },
        {
          title: "Brand Intent",
          description: "The system keeps trust signals structured instead of bolted on later.",
          items: [
            "Quiet customer prompt",
            "Operational quality signal",
            "Merchandising value for the marketing site",
          ],
        },
      ]}
    />
  );
}
