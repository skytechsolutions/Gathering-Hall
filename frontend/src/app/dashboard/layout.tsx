"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  CalendarCheck2,
  Users,
  CreditCard,
  BarChart3,
  LogOut,
  Menu,
  X,
  AlertCircle,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Halls", href: "/dashboard/halls", icon: Building2 },
  { name: "Availability Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { name: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck2 },
  { name: "Customers & Ledger", href: "/dashboard/customers", icon: Users },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Income Reports", href: "/dashboard/reports", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login?redirectTo=" + encodeURIComponent(pathname));
      } else if (user.role === "SUPER_ADMIN") {
        router.push("/super-admin");
      }
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">Loading Hall Owner Portal...</p>
        </div>
      </div>
    );
  }

  // Account Status Gates
  if (user.status === "PENDING") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-gray-900">Account Pending Approval</h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome, <strong>{user.name}</strong>. Your Hall Owner account is currently pending verification and approval by the Super Admin. You will receive full access once approved.
          </p>
          <div className="mt-6">
            <button
              onClick={() => logout()}
              className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === "BLOCKED" || user.status === "REJECTED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-gray-900">Account {user.status}</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your Hall Owner account has been {user.status.toLowerCase()}. Please contact the administration for assistance.
          </p>
          <div className="mt-6">
            <button
              onClick={() => logout()}
              className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 bg-white shadow-sm">
        <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Owner Portal</span>
            <h2 className="text-base font-bold leading-tight text-gray-900">Chamkani Hall</h2>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-red-50 text-red-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-red-600" : "text-gray-400"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="mb-3 px-3">
            <p className="text-xs font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="font-bold text-gray-900 text-sm">Owner Portal</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="w-64 bg-white h-full flex flex-col p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 border-b pb-4 mb-4">
                <Building2 className="h-6 w-6 text-red-600" />
                <span className="font-bold text-gray-900">Owner Portal</span>
              </div>
              <nav className="flex-1 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ${
                        isActive ? "bg-red-50 text-red-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t pt-4">
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
