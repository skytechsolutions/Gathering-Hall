import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/permissions";
import { signOutAction } from "@/lib/auth/actions";
import { ChangePasswordForm } from "./change-password-form";

export default async function AccountPage() {
  const user = await getCurrentUser();
  const admin = isAdmin(user?.role);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Account</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">{user?.fullName}</h1>
        <p className="mt-1 text-sm text-mute">{admin ? user?.email : `@${user?.username}`}</p>
        <span className="mt-2 inline-flex rounded-full bg-surface-card px-3 py-1 text-xs font-bold uppercase tracking-wide text-body">
          {user?.role === "ADMIN" ? "Admin" : "Staff"}
        </span>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-hairline bg-canvas shadow-sm">
        {admin ? (
          <>
            <Link
              href="/admin"
              className="flex items-center justify-between border-b border-hairline-soft px-5 py-4 text-sm font-semibold text-ink transition hover:bg-surface-soft"
            >
              Staff Management
              <span className="text-mute">→</span>
            </Link>
            <Link
              href="/reports"
              className="flex items-center justify-between px-5 py-4 text-sm font-semibold text-ink transition hover:bg-surface-soft"
            >
              Reports
              <span className="text-mute">→</span>
            </Link>
          </>
        ) : null}

        <form action={signOutAction} className={admin ? "border-t border-hairline-soft" : ""}>
          <button
            type="submit"
            className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-error transition hover:bg-error/5"
          >
            Logout
            <span>→</span>
          </button>
        </form>
      </div>

      <ChangePasswordForm />
    </div>
  );
}
