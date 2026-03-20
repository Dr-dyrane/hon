import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { listPortalAddresses } from "@/lib/db/repositories/account-repository";
import { AddressBook } from "@/components/account/AddressBook";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";

export default async function AddressesPage() {
  const session = await requireAuthenticatedSession("/account/addresses");
  const addresses = await listPortalAddresses(session.email);

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <WorkspaceContextPanel
        title="Places"
        detail="Save, edit, default."
        tags={[{ label: `${addresses.length}`, tone: "muted" }]}
      />

      <AddressBook addresses={addresses} />
    </div>
  );
}
