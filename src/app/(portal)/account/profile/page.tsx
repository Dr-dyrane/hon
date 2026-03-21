import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { getPortalProfile } from "@/lib/db/repositories/account-repository";
import { PortalProfileForm } from "@/components/account/PortalProfileForm";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";

export default async function ProfilePage() {
  const session = await requireAuthenticatedSession("/account/profile");
  const profile = await getPortalProfile(session.email);

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <WorkspaceContextPanel
        title={profile.fullName || "You"}
        detail={profile.email}
        tags={[{ label: "Profile", tone: "muted" }]}
      />

      <PortalProfileForm profile={profile} />
    </div>
  );
}
