"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { reportApi, SuperAdminOverview } from "@/services/api/report.api";
import {
  Building2,
  Users,
  CalendarCheck2,
  DollarSign,
  TrendingUp,
  Percent,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Sparkles,
  SunMedium,
  Moon,
  ShieldCheck,
} from "lucide-react";

export default function SuperAdminOverviewPage() {
  const { data, isLoading, error } = useQuery<SuperAdminOverview>({
    queryKey: ["super-admin-overview"],
    queryFn: async () => {
      const res = await reportApi.getOverview();
      return res as SuperAdminOverview;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-rose-700">
        <h3 className="font-bold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-600" /> Failed to load system metrics
        </h3>
        <p className="text-sm mt-1">Please ensure your backend server and PostgreSQL connection are running.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Platform Super Admin Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 mt-2">
            System & Operational Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Global metrics, hall approvals, owner monitoring, and platform commission tracking
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/super-admin/owners"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Add Owner
          </Link>
          <Link
            href="/super-admin/settings"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
          >
            <Percent className="h-4 w-4 text-blue-600" />
            Commission Rate
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid - 2 columns in row form on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Halls */}
        <div className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-blue-200 transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">
              Total Halls
            </span>
            <div className="rounded-2xl bg-blue-50 p-2 text-blue-600 shrink-0">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{data.totalHalls}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-semibold">
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">{data.approvedHalls} Appr.</span>
              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">{data.pendingHalls} Pend.</span>
            </div>
          </div>
        </div>

        {/* Hall Owners */}
        <div className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-purple-200 transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">
              Hall Owners
            </span>
            <div className="rounded-2xl bg-purple-50 p-2 text-purple-600 shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{data.totalOwners}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-semibold">
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">{data.approvedOwners} Appr.</span>
              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">{data.pendingOwners} Pend.</span>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="rounded-3xl border border-gray-100 bg-white p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-indigo-200 transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">
              Total Bookings
            </span>
            <div className="rounded-2xl bg-indigo-50 p-2 text-indigo-600 shrink-0">
              <CalendarCheck2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{data.totalBookings}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs font-semibold">
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">{data.confirmedBookings} Conf.</span>
              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">{data.holdBookings} Hold</span>
            </div>
          </div>
        </div>

        {/* Global Commission */}
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider truncate">
              Platform Commission
            </span>
            <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700 shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg sm:text-2xl font-black text-emerald-900 truncate">
              PKR {Number(data.totalCommissionEarned || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-emerald-700 font-semibold truncate">
              Volume: PKR {Number(data.totalRevenue || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Health Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="col-span-2 sm:col-span-1 rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Booking Value</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-gray-900">
            PKR {Number(data.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500 font-medium">All confirmed bookings platform-wide</p>
        </div>

        <div className="col-span-1 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <p className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">Deposits Held</p>
          <div className="mt-2">
            <p className="text-base sm:text-2xl font-black text-emerald-900 truncate">
              PKR {Number(data.totalAdvanceReceived || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-emerald-700 font-semibold truncate">Customer advances</p>
          </div>
        </div>

        <div className="col-span-1 rounded-3xl border border-amber-100 bg-amber-50/40 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <p className="text-[11px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider">Receivables Due</p>
          <div className="mt-2">
            <p className="text-base sm:text-2xl font-black text-amber-900 truncate">
              PKR {Number(data.totalRemainingAmount || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-amber-700 font-semibold truncate">Pending on event day</p>
          </div>
        </div>
      </div>

      {/* Monthly Chart & Recent Owners */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">Platform Monthly Revenue</h3>
              <p className="text-xs text-gray-400 font-medium">Total volume across all active venues</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              Past 6 Months
            </span>
          </div>

          <div className="space-y-4">
            {data.monthlyRevenueChart && data.monthlyRevenueChart.length > 0 ? (
              data.monthlyRevenueChart.map((m, idx) => {
                const maxRev = Math.max(...data.monthlyRevenueChart.map((x) => x.revenue || 1));
                const pct = Math.max(8, Math.round(((m.revenue || 0) / maxRev) * 100));
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700">{m.month}</span>
                      <span className="text-gray-900 font-bold">
                        PKR {Number(m.revenue || 0).toLocaleString()}{" "}
                        <span className="text-gray-400 font-normal">({m.bookings} bookings)</span>
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500 shadow-sm"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 py-10 text-center font-medium">No monthly booking records yet.</p>
            )}
          </div>
        </div>

        {/* Recent Registered Owners */}
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-lg text-gray-900">Recent Owners</h3>
                <p className="text-xs text-gray-400 font-medium">Newly registered hall partners</p>
              </div>
              <Link
                href="/super-admin/owners"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View all &rarr;
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {data.recentOwners && data.recentOwners.length > 0 ? (
                data.recentOwners.map((owner) => (
                  <div key={owner.id} className="py-3.5 flex items-center justify-between hover:bg-gray-50/50 rounded-xl px-2 transition">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{owner.name}</p>
                      <p className="text-xs text-gray-400 font-mono font-medium">{owner.phone || owner.email}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        owner.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : owner.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : owner.status === "BLOCKED"
                          ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {owner.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 py-8 text-center font-medium">No owners registered yet.</p>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <Link
              href="/super-admin/owners"
              className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              Manage Hall Owners <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-extrabold text-lg text-gray-900">Recent Bookings Across All Halls</h3>
            <p className="text-xs text-gray-400 font-medium">Live bookings and reservation holds across venues</p>
          </div>
          <Link
            href="/super-admin/bookings"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
          >
            View all bookings &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-xs font-bold uppercase text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3">Booking #</th>
                <th className="px-4 py-3">Hall</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Event Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {data.recentBookings && data.recentBookings.length > 0 ? (
                data.recentBookings.map((b) => {
                  const isNight = b.notes?.includes("[SESSION:NIGHT]");
                  return (
                    <tr key={b.id} className="hover:bg-blue-50/20 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-blue-600">{b.bookingNumber}</td>
                      <td className="px-4 py-3.5 font-bold text-gray-900">{b.hall?.name || "—"}</td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-gray-900">{b.customerName}</p>
                        <p className="text-xs text-gray-400 font-mono">{b.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {isNight ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                            <Moon className="h-3 w-3" /> Night
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
                            <SunMedium className="h-3 w-3" /> Day
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-700">{b.eventDate}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : b.status === "HOLD"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                              : b.status === "BLOCKED"
                              ? "bg-gray-900 text-white"
                              : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-gray-900">
                        PKR {Number(b.totalAmount || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400 font-medium">
                    No bookings recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
