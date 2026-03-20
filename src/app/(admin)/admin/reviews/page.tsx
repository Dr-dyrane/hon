import { ScaffoldPage } from "@/components/shell/ScaffoldPage";

export default function AdminReviewsPage() {
  return (
    <ScaffoldPage
      badge="Reviews"
      title="Moderation and trust merchandising."
      description="This route will moderate incoming reviews, manage featured trust content, and keep the brand signal clean before anything reaches the marketing site."
      primaryAction={{ href: "/account/reviews", label: "Portal Review Surface" }}
      summary={[
        {
          label: "Policy",
          value: "Pre-Moderated",
          detail: "The review lifecycle is intentionally moderated before public exposure.",
        },
        {
          label: "Source",
          value: "Delivered Orders",
          detail: "Only delivered orders generate review requests and valid review submissions.",
        },
        {
          label: "Outcome",
          value: "Featured Trust",
          detail: "Approved reviews can later power social proof sections on the storefront.",
        },
      ]}
      sections={[
        {
          title: "Moderation Model",
          description: "Operators need enough context to make high-confidence moderation decisions.",
          items: [
            "Review content",
            "Source order snapshot",
            "Approve, hide, or feature controls",
          ],
        },
        {
          title: "Brand Control",
          description: "Review handling should align with the premium positioning of the brand.",
          items: [
            "No auto-publish at launch",
            "Clear featured pathway",
            "Review history remains auditable",
          ],
        },
        {
          title: "System Fit",
          description: "This route closes the loop between delivery and social proof.",
          items: [
            "Review request after delivery",
            "Moderation in admin",
            "Binding into layout sections later",
          ],
        },
      ]}
    />
  );
}
