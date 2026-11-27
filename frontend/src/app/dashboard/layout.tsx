"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  CalendarCheck2,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  AlertCircle,
  Bell,
  Sun,
  Moon,
  Headphones,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Halls", href: "/dashboard/halls", icon: Building2 },
  { name: "Availability Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { name: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck2 },
  { name: "Customers & Ledger", href: "/dashboard/customers", icon: Users },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Income Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const MOBILE_BOTTOM_NAV = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { name: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck2 },
  { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout, brandSettings } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useScrollLock(mobileMenuOpen);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#1e382b] border-t-transparent" />
          <p className="text-sm font-semibold text-[#6c726d]">Loading Chamkani Portal...</p>
        </div>
      </div>
    );
  }

  if (user.status === "PENDING") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8] p-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-[#faf7f2] p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#1f2421]">Account Pending Approval</h2>
          <p className="mt-2 text-sm text-[#6c726d] leading-relaxed">
            Welcome, <strong>{user.name}</strong>. Your Hall Owner account is currently pending verification by the Super Admin. You will receive full access once approved.
          </p>
          <div className="mt-6">
            <button
              onClick={() => logout()}
              className="w-full rounded-xl bg-[#ebe3d7] py-3 text-sm font-bold text-[#1f2421] hover:bg-[#dfd6c8] transition"
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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e8] p-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-[#faf7f2] p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#1f2421]">Account {user.status}</h2>
          <p className="mt-2 text-sm text-[#6c726d] leading-relaxed">
            Your Hall Owner account has been {user.status.toLowerCase()}. Please contact system administration for assistance.
          </p>
          <div className="mt-6">
            <button
              onClick={() => logout()}
              className="w-full rounded-xl bg-[#ebe3d7] py-3 text-sm font-bold text-[#1f2421] hover:bg-[#dfd6c8] transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-[#f5f0e8] flex overflow-hidden">
      {/* ============================================================== */}
      {/* DESKTOP SIDEBAR NAVIGATION (100% Glassy Liquid Design)         */}
      {/* ============================================================== */}
      <aside
        className={`hidden lg:flex flex-col my-3 ml-3 rounded-3xl bg-[#0b0c16]/80 backdrop-blur-2xl border border-white/[0.12] text-white shrink-0  z-40 select-none h-[calc(100vh-24px)] transition-all duration-300 ease-in-out relative ${
          sidebarCollapsed ? "w-[82px] overflow-visible" : "w-64 overflow-hidden"
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex h-18 items-center border-b border-white/[0.08] transition-all duration-300 shrink-0 ${
            sidebarCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"
          }`}
        >
          <div className="flex items-center gap-3 truncate w-full">
            {/* Custom Logo or Golden Amber Squircle Logo */}
            {brandSettings.logoUrl ? (
              <div className="h-9 w-9 shrink-0 rounded-2xl overflow-hidden border border-white/20 bg-slate-950/60 flex items-center justify-center p-0.5">
                <img
                  src={brandSettings.logoUrl}
                  alt={brandSettings.hallName || "Hall Logo"}
                  className="h-full w-full object-cover rounded-xl"
                />
              </div>
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 border border-white/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-slate-950 stroke-[2.4]" />
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="overflow-hidden truncate flex-1 min-w-0">
                <h1 className="text-sm font-extrabold text-white tracking-tight leading-tight truncate">
                  {brandSettings.hallName || "Chamkani Hall"}
                </h1>
                <p className="text-[11px] text-white/45 truncate leading-tight mt-0.5">
                  {user.email || "owner@chamkani.com"}
                </p>
              </div>
            )}
          </div>
        </div>


        {/* Navigation Items with matching Frosted Glass Sheen */}
        {!sidebarCollapsed ? (
          <nav className="flex-1 space-y-1 p-3 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 group ${
                    isActive
                      ? "bg-white/[0.14] text-white border border-white/[0.18]"
                      : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-white/60 group-hover:text-white"
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="flex-1 space-y-2 py-2 overflow-visible">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <div key={item.name} className="relative group flex justify-center">
                  <Link
                    href={item.href}
                    className={`flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-200 relative ${
                      isActive
                        ? "bg-white/[0.18] text-white border border-white/[0.22] shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                        : "text-white/60 hover:text-white hover:bg-white/[0.12] hover:shadow-[0_0_12px_rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`} />
                  </Link>

                  {/* High-Contrast Light Popover Tooltip */}
                  <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-black text-xs border border-slate-100 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100 origin-left z-50 whitespace-nowrap flex items-center">
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rotate-45 border-l border-b border-slate-200" />
                    <span>{item.name}</span>
                  </div>
                </div>
              );
            })}
          </nav>
        )}

        {/* User Account Footer */}
        <div className="border-t border-white/[0.08] p-3 transition-all duration-300 shrink-0">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate">
                <div className="h-9 w-9 shrink-0 rounded-2xl bg-white/[0.10] border border-white/[0.15] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                  {user.name ? user.name.charAt(0).toUpperCase() : "O"}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate leading-tight">{user.name}</p>
                  <p className="text-[10px] text-white/40 truncate leading-tight mt-0.5">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="rounded-xl p-2 text-white/50 hover:text-red-400 hover:bg-white/10 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center relative group">
              <button
                onClick={() => logout()}
                className="h-9 w-9 shrink-0 rounded-2xl bg-white/[0.10] hover:bg-red-500/20 border border-white/[0.15] hover:border-red-500/30 text-white flex items-center justify-center font-bold text-xs transition cursor-pointer shadow-inner"
              >
                {user.name ? user.name.charAt(0).toUpperCase() : "O"}
              </button>
              {/* High-Contrast Light Popover Tooltip */}
              <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-black text-xs border border-slate-100 opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 scale-95 group-hover:scale-100 origin-left z-50 whitespace-nowrap flex items-center">
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rotate-45 border-l border-b border-slate-200" />
                <span>Sign Out ({user.name})</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN CONTENT AREA WITH TOP NAV BAR                             */}
      {/* ============================================================== */}
      <div className="flex flex-1 flex-col overflow-hidden h-full min-h-0 bg-[#f5f0e8]">
        {/* Professional Top Navigation Bar */}
        <header className="h-12 border-b border-[#e5ded4] bg-[#faf7f2] px-3 sm:px-6 flex items-center justify-between shrink-0 z-30 transition-colors">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Toggle Button: Collapses Desktop Sidebar, Opens Mobile Drawer */}
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  setMobileMenuOpen(true);
                } else {
                  setSidebarCollapsed((prev) => !prev);
                }
              }}
              className="rounded-xl p-1.5 sm:p-2 text-[#6c726d] hover:text-[#1f2421] hover:bg-[#ebe3d7] transition cursor-pointer shrink-0"
              aria-label="Toggle navigation"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse to icons"}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Functional Real-Time Notification Bell Dropdown */}
            <NotificationBell role="HALL_OWNER" />

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#e5ded4] shrink-0">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#1e382b] to-[#2d4a3b] text-white font-extrabold text-xs ring-2 ring-[#1e382b]/20 shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : "O"}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-bold text-[#1f2421] leading-tight">{user.name}</p>
                <p className="text-[10px] text-[#6c726d] font-medium leading-tight">Hall Owner</p>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer with Smooth Slide/Fade Animation */}
        <div
          className={`lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden={!mobileMenuOpen}
        >
          <div
            className={`fixed inset-y-0 left-0 w-[290px] sm:w-[320px] max-w-[85vw] bg-[#0b1329] text-white h-full flex flex-col p-5 rounded-r-3xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-3">
              <div className="flex items-center gap-3 truncate">
                {brandSettings.logoUrl ? (
                  <div className="h-10 w-10 shrink-0 rounded-2xl overflow-hidden border border-white/20 bg-black/40 flex items-center justify-center p-0.5">
                    <img
                      src={brandSettings.logoUrl}
                      alt={brandSettings.hallName || "Hall Logo"}
                      className="h-full w-full object-cover rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3b3c44] text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                )}
                <div className="truncate">
                  <h2 className="font-extrabold text-white text-base leading-tight truncate">
                    {brandSettings.hallName || "Chamkani Hall"}
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase">
                    Owner Portal
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto overscroll-contain py-2 pr-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#3b3c44] text-white font-bold"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/10 pt-4 mt-auto">
              <div className="mb-3 px-1">
                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Viewport */}
        <main
          className={`flex-1 min-h-0 bg-[#f5f0e8] ${
            pathname === "/dashboard/calendar"
              ? "overflow-y-auto lg:overflow-hidden p-0 flex flex-col pb-24 lg:pb-0 h-full"
              : "overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8"
          }`}
        >
          {children}
        </main>

        {/* Mobile Bottom Navigation Dock */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf7f2]/95 backdrop-blur-md border-t border-[#e5ded4] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around">
          {MOBILE_BOTTOM_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                  isActive
                    ? "text-[#1e382b] font-bold"
                    : "text-[#6c726d] hover:text-[#1f2421] font-medium"
                }`}
              >
                <div className={`relative p-1 rounded-lg transition-colors ${isActive ? "bg-[#ebe3d7]" : ""}`}>
                  <Icon className={`h-5 w-5 ${isActive ? "text-[#1e382b]" : "text-[#6c726d]"}`} />
                  {isActive && (
                    <span className="absolute -top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-[#1e382b] shadow-[0_0_6px_#1e382b]" />
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
