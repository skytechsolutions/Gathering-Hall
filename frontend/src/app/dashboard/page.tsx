"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { reportApi, OwnerOverview } from "@/services/api/report.api";
import {
  Building2,
  CalendarCheck2,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  CalendarDays,
  ArrowRight,
} from "lucide-react";

export default function OwnerOverviewPage() {
  const { data, isLoading, error } = useQuery<OwnerOverview>({
    queryKey: ["owner-overview"],
    queryFn: async () => {
      const res = await reportApi.getOverview();
      return res as OwnerOverview;
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
        <h3 className="font-bold">Failed to load dashboard metrics</h3>
        <p className="text-sm mt-1">Please ensure your backend server and PostgreSQL connection are running.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hall Owner Dashboard</h1>
          <p className="text-sm text-gray-500">Live booking reservations, schedules, and revenue performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            New Booking
          </Link>
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            <CalendarDays className="h-4 w-4 text-gray-500" />
            Availability Calendar
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* My Halls */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Halls</span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{data.myHallsCount}</p>
            <p className="mt-1 text-xs text-gray-500">Active wedding venues registered</p>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Bookings</span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{data.totalBookings}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <span className="text-green-700 font-medium">{data.confirmedBookings} Confirmed</span>
              <span>•</span>
              <span className="text-amber-600 font-medium">{data.holdBookings} on Hold</span>
            </div>
          </div>
        </div>

        {/* Advance Received */}
        <div className="rounded-2xl border border-green-200 bg-green-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">Advance Collected</span>
            <div className="rounded-xl bg-green-100 p-2 text-green-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-green-800">
              PKR {Number(data.advanceReceived || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-green-600">Advance deposits held in account</p>
          </div>
        </div>

        {/* Remaining Due */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Remaining Balance</span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-amber-800">
              PKR {Number(data.remainingPayments || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-amber-600">Receivable on event dates</p>
          </div>
        </div>
      </div>

      {/* Monthly Chart & Upcoming Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Income Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Monthly Revenue (Confirmed Bookings)</h3>
            <span className="text-xs font-semibold text-gray-400">Past 6 Months</span>
          </div>

          <div className="space-y-4">
            {data.monthlyChart && data.monthlyChart.length > 0 ? (
              data.monthlyChart.map((m, idx) => {
                const maxRev = Math.max(...data.monthlyChart.map((x) => x.revenue || 1));
                const pct = Math.max(5, Math.round(((m.revenue || 0) / maxRev) * 100));
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-700">{m.month}</span>
                      <span className="text-gray-900 font-bold">
                        PKR {Number(m.revenue || 0).toLocaleString()} ({m.bookings} events)
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
              <p className="text-sm text-gray-500 py-6 text-center">No revenue history recorded yet.</p>
            )}
          </div>
        </div>

        {/* Upcoming Events Box */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Upcoming Events</h3>
              <Link href="/dashboard/calendar" className="text-xs font-semibold text-red-600 hover:underline">
                View Calendar
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {data.upcomingEvents && data.upcomingEvents.length > 0 ? (
                data.upcomingEvents.map((evt) => (
                  <div key={evt.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-600 font-mono">{evt.eventDate}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                        {evt.eventType || "Event"}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{evt.customerName}</p>
                    <p className="text-xs text-gray-500">{evt.hall?.name || "Venue"}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 py-6 text-center">No upcoming events scheduled.</p>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <Link
              href="/dashboard/bookings"
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
            >
              Manage All Bookings <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Recent Bookings & Holds</h3>
            <p className="text-xs text-gray-500">Latest reservations across your registered halls</p>
          </div>
          <Link href="/dashboard/bookings" className="text-xs font-semibold text-red-600 hover:underline">
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
