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
  SunMedium,
  Moon,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
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
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#3b3c44] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 text-rose-700">
        <h3 className="font-bold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-600" /> Failed to load dashboard metrics
        </h3>
        <p className="text-sm mt-1">Please ensure your backend server and PostgreSQL connection are running.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl p-6 border border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-[#3b3c44] border border-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-[#3b3c44]" /> Owner Portal Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 mt-2">
            Welcome to Chamkani Hall Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Real-time reservations, Day/Night booking sessions, and revenue ledger
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center gap-2 rounded-xl bg-[#3b3c44] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#2b2c33] active:scale-95 transition"
          >
            <PlusCircle className="h-4 w-4" />
            New Booking
          </Link>
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
          >
            <CalendarDays className="h-4 w-4 text-[#3b3c44]" />
            Availability Calendar
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid - 2 columns in row form on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* My Halls */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex flex-col justify-between hover:border-slate-200 transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">
              My Halls
            </span>
            <div className="rounded-xl bg-slate-100 p-2 text-[#3b3c44] shrink-0">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl sm:text-3xl font-black text-gray-900">{data.myHallsCount}</p>
            <p className="mt-1 text-[11px] sm:text-xs text-gray-500 truncate font-medium">Registered venue halls</p>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 flex flex-col justify-between hover:border-indigo-200 transition">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">
              Total Bookings
            </span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 shrink-0">
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

        {/* Advance Received */}
        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider truncate">
              Advance Collected
            </span>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 shrink-0">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg sm:text-2xl font-black text-emerald-900 truncate">
              PKR {Number(data.advanceReceived || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-emerald-700 truncate font-semibold">Deposits secured</p>
          </div>
        </div>

        {/* Remaining Due */}
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider truncate">
              Balance Due
            </span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg sm:text-2xl font-black text-amber-900 truncate">
              PKR {Number(data.remainingPayments || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-amber-700 truncate font-semibold">Receivable on event day</p>
          </div>
        </div>
      </div>

      {/* Monthly Chart & Upcoming Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Monthly Income Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-gray-900">Monthly Revenue Trend</h3>
              <p className="text-xs text-gray-400 font-medium">Income from confirmed bookings (Last 6 Months)</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-[#3b3c44] border border-slate-200">
              Confirmed Bookings
            </span>
          </div>

          <div className="space-y-4">
            {data.monthlyChart && data.monthlyChart.length > 0 ? (
              data.monthlyChart.map((m, idx) => {
                const maxRev = Math.max(...data.monthlyChart.map((x) => x.revenue || 1));
                const pct = Math.max(8, Math.round(((m.revenue || 0) / maxRev) * 100));
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700">{m.month}</span>
                      <span className="text-gray-900 font-bold">
                        PKR {Number(m.revenue || 0).toLocaleString()}{" "}
                        <span className="text-gray-400 font-normal">({m.bookings} events)</span>
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3b3c44] to-[#25262c] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-400 py-10 text-center font-medium">No revenue history recorded yet.</p>
            )}
          </div>
        </div>

        {/* Upcoming Events Box */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Upcoming Events</h3>
                <p className="text-xs text-gray-400 font-medium">Scheduled bookings</p>
              </div>
              <Link
                href="/dashboard/calendar"
                className="text-xs font-bold text-[#3b3c44] hover:text-[#3b3c44] hover:underline"
              >
                Calendar &rarr;
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {data.upcomingEvents && data.upcomingEvents.length > 0 ? (
                data.upcomingEvents.map((evt) => {
                  const isNight = evt.notes?.includes("[SESSION:NIGHT]");
                  return (
                    <div key={evt.id} className="py-3.5 hover:bg-gray-50/50 rounded-xl px-2 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#3b3c44] font-mono">{evt.eventDate}</span>
                        <div className="flex items-center gap-1.5">
                          {isNight ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                              <Moon className="h-2.5 w-2.5" /> Night
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/50">
                              <SunMedium className="h-2.5 w-2.5" /> Day
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                            {evt.eventType || "Event"}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-1">{evt.customerName}</p>
                      <p className="text-xs text-gray-500 font-medium">{evt.hall?.name || "Venue"}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-400 py-10 text-center font-medium">No upcoming events scheduled.</p>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <Link
              href="/dashboard/bookings"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              Manage All Bookings <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-lg text-gray-900">Recent Bookings & Holds</h3>
            <p className="text-xs text-gray-400 font-medium">Latest reservations across your registered halls</p>
          </div>
          <Link
            href="/dashboard/bookings"
            className="text-xs font-bold text-[#3b3c44] hover:text-[#3b3c44] hover:underline"
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
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {data.recentBookings && data.recentBookings.length > 0 ? (
                data.recentBookings.map((b) => {
                  const isNight = b.notes?.includes("[SESSION:NIGHT]");
                  return (
                    <tr key={b.id} className="hover:bg-slate-100/50 transition">
                      <td className="px-4 py-3.5 font-mono font-bold text-[#3b3c44]">{b.bookingNumber}</td>
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
