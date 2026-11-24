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

// Most important primary icons for mobile bottom navigation dock
const MOBILE_BOTTOM_NAV = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { name: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck2 },
  { name: "Halls", href: "/dashboard/halls", icon: Building2 },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
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
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm block leading-tight">Chamkani Hall</span>
              <span className="text-[10px] text-red-600 font-semibold uppercase tracking-wider">Owner Portal</span>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer (Full Menu) */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)}>
            <div
              className="w-72 bg-white h-full flex flex-col p-5 shadow-2xl animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 text-sm block">Chamkani Hall</span>
                    <span className="text-[10px] text-gray-500 font-medium">Owner Menu</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                        isActive ? "bg-red-50 text-red-700 font-bold" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-red-600" : "text-gray-400"}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="mb-3 px-2">
                  <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area (With bottom padding for mobile dock) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>

        {/* ============================================================== */}
        {/* MOBILE BOTTOM NAVIGATION DOCK (Most Important Icons for Owner) */}
        {/* ============================================================== */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                  isActive
                    ? "text-red-600 font-bold"
                    : "text-gray-500 hover:text-gray-900 font-medium"
                }`}
              >
                <div className={`relative p-1 rounded-lg transition-colors ${isActive ? "bg-red-50" : ""}`}>
                  <Icon className={`h-5 w-5 ${isActive ? "text-red-600" : "text-gray-500"}`} />
                  {isActive && (
                    <span className="absolute -top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-red-600 shadow-[0_0_6px_#dc2626]" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
