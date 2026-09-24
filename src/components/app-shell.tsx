import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/permissions";
import { signOutAction } from "@/lib/auth/actions";
import { NavLinks } from "@/components/nav-links";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { HallLogo } from "@/components/hall-logo";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const isLoggedIn = Boolean(user);
  const showAdminOnly = isLoggedIn && isAdmin(user?.role);

  return (
    <>
      {isLoggedIn ? (
        <div className="min-h-screen bg-surface-soft">
          <header className="border-b border-hairline bg-canvas">
            {/* Mobile: logo only — nav and logout live in the bottom bar */}
            <div className="flex items-center justify-center gap-2 px-4 py-3 sm:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                <HallLogo className="h-[18px] w-[18px]" />
              </span>
              <span className="text-base font-bold text-ink">Chamkani Gathering Hall</span>
            </div>

            {/* Desktop: full header + top nav */}
            <div className="hidden sm:block">
              <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Private Hall System</p>
                  <h1 className="text-lg font-bold text-ink">Chamkani Gathering Hall</h1>
                </div>

                <div className="flex items-center gap-3">
                  <span className="hidden rounded-full bg-surface-card px-3 py-1 text-xs font-semibold text-body sm:inline-flex">
                    {user?.fullName} ({user?.role})
                  </span>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="rounded-2xl bg-secondary-bg px-4 py-2 text-sm font-bold text-ink transition hover:bg-secondary-pressed"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              </div>

              <nav className="mx-auto max-w-7xl overflow-x-auto px-4 pb-3 sm:px-6 lg:px-8">
                <NavLinks showAdmin={showAdminOnly} />
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">{children}</main>

          <MobileBottomNav />
        </div>
      ) : (
        <>{children}</>
      )}
    </>
  );
}
