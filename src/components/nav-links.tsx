"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bookings", label: "Bookings" },
  { href: "/customers", label: "Customers" },
  { href: "/reports", label: "Reports", adminOnly: true },
  { href: "/admin", label: "Staff Management", adminOnly: true },
];

export function NavLinks({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();

  const items = navItems.filter((item) => (item.adminOnly ? showAdmin : true));

  return (
    <div className="flex min-w-max gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full px-4 py-2 text-sm font-medium text-body transition hover:bg-surface-card"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
