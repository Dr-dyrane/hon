import { signOutAction } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-full bg-system-fill/72 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-secondary-label transition-colors duration-200 hover:bg-system-fill hover:text-label"
      >
        Sign out
      </button>
    </form>
  );
}
