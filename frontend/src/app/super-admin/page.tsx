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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h3 className="font-bold">Failed to load system metrics</h3>
        <p className="text-sm mt-1">Please ensure your backend server and PostgreSQL connection are running.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">System Overview</h1>
          <p className="text-sm text-gray-500">Live operational & financial metrics across all halls and owners</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/super-admin/owners"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Add Owner
          </Link>
          <Link
            href="/super-admin/settings"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <Percent className="h-4 w-4 text-gray-500" />
            Commission Rate
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Halls */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Halls</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{data.totalHalls}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span className="text-green-700 font-medium">{data.approvedHalls} Approved</span>
              <span>•</span>
              <span className="text-amber-600 font-medium">{data.pendingHalls} Pending</span>
            </div>
          </div>
        </div>

        {/* Hall Owners */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hall Owners</span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{data.totalOwners}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span className="text-green-700 font-medium">{data.approvedOwners} Approved</span>
              <span>•</span>
              <span className="text-amber-600 font-medium">{data.pendingOwners} Pending</span>
            </div>
          </div>
        </div>

        {/* Bookings */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Bookings</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{data.totalBookings}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span className="text-green-700 font-medium">{data.confirmedBookings} Confirmed</span>
              <span>•</span>
              <span className="text-amber-600 font-medium">{data.holdBookings} on Hold</span>
            </div>
          </div>
        </div>

        {/* Global Commission */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Commission</span>
            <div className="rounded-xl bg-green-50 p-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">
              PKR {Number(data.totalCommissionEarned || 0).toLocaleString()}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Revenue: PKR {Number(data.totalRevenue || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Health Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            PKR {Number(data.totalRevenue || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">All confirmed bookings across all halls</p>
        </div>

        <div className="rounded-2xl border border-green-200 bg-green-50/50 p-5 shadow-sm">
          <p className="text-xs font-semibold text-green-800 uppercase tracking-wider">Advance Collected</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            PKR {Number(data.totalAdvanceReceived || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-green-600">Paid deposits currently held</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Remaining Balance</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            PKR {Number(data.totalRemainingAmount || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-amber-600">Receivable before or on event dates</p>
        </div>
      </div>

      {/* Monthly Chart & Recent Owners */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Monthly Revenue & Volume</h3>
            <span className="text-xs font-semibold text-gray-400">Past 6 Months</span>
          </div>

          <div className="space-y-4">
            {data.monthlyRevenueChart && data.monthlyRevenueChart.length > 0 ? (
              data.monthlyRevenueChart.map((m, idx) => {
                const maxRev = Math.max(...data.monthlyRevenueChart.map((x) => x.revenue || 1));
                const pct = Math.max(5, Math.round(((m.revenue || 0) / maxRev) * 100));
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-700">{m.month}</span>
                      <span className="text-gray-900 font-bold">
                        PKR {Number(m.revenue || 0).toLocaleString()} ({m.bookings} bookings)
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 py-6 text-center">No monthly booking records yet.</p>
            )}
          </div>
        </div>

        {/* Recent Registered Owners */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Recent Owners</h3>
              <Link href="/super-admin/owners" className="text-xs font-semibold text-red-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {data.recentOwners && data.recentOwners.length > 0 ? (
                data.recentOwners.map((owner) => (
                  <div key={owner.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{owner.name}</p>
                      <p className="text-xs text-gray-500">{owner.phone || owner.email}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        owner.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : owner.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : owner.status === "BLOCKED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {owner.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 py-4">No owners registered yet.</p>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <Link
              href="/super-admin/owners"
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Manage Hall Owners <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Recent Bookings Across All Halls</h3>
            <p className="text-xs text-gray-500">Real-time reservations and token holds</p>
          </div>
          <Link href="/super-admin/bookings" className="text-xs font-semibold text-red-600 hover:underline">
            View all bookings
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Booking #</th>
                <th className="px-4 py-3">Hall</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Event Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentBookings && data.recentBookings.length > 0 ? (
                data.recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-medium text-gray-900">{b.bookingNumber}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{b.hall?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{b.customerName}</p>
                      <p className="text-xs text-gray-400">{b.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">{b.eventDate}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          b.status === "CONFIRMED"
                            ? "bg-green-100 text-green-800"
                            : b.status === "HOLD"
                            ? "bg-yellow-100 text-yellow-800"
                            : b.status === "BLOCKED"
                            ? "bg-gray-900 text-white"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      PKR {Number(b.totalAmount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
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
