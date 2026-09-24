"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function UpcomingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M8 6h12M8 12h12M8 18h12" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5" />
    </svg>
  );
}

const tabClass = (active: boolean) => `flex w-14 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold ${active ? "text-primary" : "text-mute"}`;

export function MobileBottomNav() {
  const pathname = usePathname();

  const dashboardActive = pathname === "/dashboard";
  const upcomingActive = pathname === "/dashboard/upcoming";
  const bookingsActive = pathname === "/bookings";
  const accountActive = pathname === "/account" || pathname === "/admin";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-canvas sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-end justify-between px-2 pb-2 pt-2">
        <Link href="/dashboard" className={tabClass(dashboardActive)}>
          <DashboardIcon />
          Dashboard
        </Link>
        <Link href="/dashboard/upcoming" className={tabClass(upcomingActive)}>
          <UpcomingIcon />
          Upcoming
        </Link>

        <Link
          href="/bookings/new"
          className="-mt-6 flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary-pressed"
          aria-label="Add Booking"
        >
          <span className="text-2xl leading-none">+</span>
        </Link>

        <Link href="/bookings" className={tabClass(bookingsActive)}>
          <ListIcon />
          Bookings
        </Link>

        <Link href="/account" className={tabClass(accountActive)}>
          <AccountIcon />
          Account
        </Link>
      </div>
    </nav>
  );
}
