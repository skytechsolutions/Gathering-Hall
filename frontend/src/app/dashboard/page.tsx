"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";
import { reportApi, OwnerOverview } from "@/services/api/report.api";
import { useAuth } from "@/context/auth-context";
import { AlertCircle } from "lucide-react";

export default function OwnerOverviewPage() {
  const { user } = useAuth();

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
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#1e382b] border-t-transparent" />
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

  // Calculate financial and event metrics
  const advanceCollected = Number(data.advanceReceived || 0);
  const balanceDue = Number(data.remainingPayments || 0);
  const totalBooked = advanceCollected + balanceDue;

  const advancePct = totalBooked > 0 ? Math.min(100, Math.max(0, Math.round((advanceCollected / totalBooked) * 100))) : 0;
  const balancePct = 100 - advancePct;

  // Today's event logic
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayEvents = (data.upcomingEvents || []).filter((e) => e.eventDate === todayStr);
  const todayCount = todayEvents.length;
  const todayEvent = todayEvents[0] || data.upcomingEvents?.[0] || null;
  const todayIsNight = todayEvent?.notes?.includes("[SESSION:NIGHT]");

  // Next scheduled events (excluding today if shown)
  const upcomingEvents = (data.upcomingEvents || []).slice(0, 4);

  // Monthly Chart values
  const monthlyData = data.monthlyChart && data.monthlyChart.length > 0 ? data.monthlyChart : [
    { month: "Jun", revenue: 0, bookings: 0 },
    { month: "Jul", revenue: 0, bookings: 0 },
    { month: "Aug", revenue: 0, bookings: 0 },
    { month: "Sep", revenue: 0, bookings: 0 },
    { month: "Oct", revenue: 0, bookings: 0 },
    { month: "Nov", revenue: totalBooked || 150000, bookings: 1 },
  ];

  const maxMonthRev = Math.max(...monthlyData.map((m) => m.revenue || 0), 1);

  return (
    <div className="space-y-6 select-none font-sans">
      {/* ============================================================== */}
      {/* 1. TOP HEADER ROW (Exact matches media_1795762701294_7f6fb371) */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#7a6f60]">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1f2421] tracking-tight mt-1 font-normal">
            Welcome back, {user?.name || "Faraz"}
          </h1>
          <p className="text-xs sm:text-sm text-[#7a6f60] font-normal mt-1">
            {todayCount === 1
              ? `One event today. ${balanceDue > 0 ? `PKR ${balanceDue.toLocaleString()} is still to collect.` : "All payments cleared."}`
              : todayCount > 1
              ? `${todayCount} events today. ${balanceDue > 0 ? `PKR ${balanceDue.toLocaleString()} is still to collect.` : "All payments cleared."}`
              : `No events today. ${balanceDue > 0 ? `PKR ${balanceDue.toLocaleString()} is still to collect.` : "All payments up to date."}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/calendar"
            className="rounded-lg border border-[#d6cec3] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#1f2421] hover:bg-[#faf7f2] transition shadow-xs"
          >
            Calendar
          </Link>
          <Link
            href="/dashboard/bookings"
            className="rounded-lg bg-[#1e382b] hover:bg-[#162a20] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition shadow-xs active:scale-[0.98]"
          >
            New booking
          </Link>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MAIN 2-COLUMN GRID (8-col Left, 4-col Right on Desktop)    */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Money */}
          <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 shadow-2xs">
            <div>
              <h2 className="font-serif text-lg sm:text-xl text-[#1f2421] font-normal">Money</h2>
              <p className="text-xs text-[#7a6f60] font-normal mt-0.5">Confirmed bookings</p>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-3xl sm:text-4xl text-[#1f2421] font-normal">
                PKR {totalBooked.toLocaleString()}
              </span>
              <span className="text-xs text-[#7a6f60] font-normal">total booked</span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="my-5 h-3.5 sm:h-4 w-full rounded-full overflow-hidden flex bg-[#e5ded4]/40">
              {advancePct > 0 && (
                <div
                  className="h-full bg-[#1e382b] transition-all duration-500"
                  style={{ width: `${advancePct}%` }}
                />
              )}
              {balancePct > 0 && (
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${advancePct > 0 ? balancePct : 100}%`,
                    backgroundColor: "#c28e36",
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 6px, transparent 6px, transparent 12px)",
                  }}
                />
              )}
            </div>

            {/* Breakdown metrics below progress bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-[#7a6f60] font-normal">
                  <span className="w-2.5 h-2.5 bg-[#1e382b] rounded-xs inline-block shrink-0" />
                  <span>Advance collected</span>
                </div>
                <p className="font-bold text-base sm:text-lg text-[#1f2421] pl-4">
                  PKR {advanceCollected.toLocaleString()}
                </p>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-[#7a6f60] font-normal">
                  <span className="w-2.5 h-2.5 bg-[#c28e36] rounded-xs inline-block shrink-0" />
                  <span>Balance due on event day</span>
                </div>
                <p className="font-bold text-base sm:text-lg text-[#1f2421] pl-4">
                  PKR {balanceDue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Income by month */}
          <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 shadow-2xs">
            <div>
              <h2 className="font-serif text-lg sm:text-xl text-[#1f2421] font-normal">Income by month</h2>
              <p className="text-xs text-[#7a6f60] font-normal mt-0.5">Confirmed bookings, last 6 months</p>
            </div>

            {/* Vertical Bar Chart matching screenshot */}
            <div className="mt-8 pt-4">
              <div className="h-44 sm:h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 sm:px-4 border-b border-[#d6cec3]">
                {monthlyData.map((m, idx) => {
                  const rev = Number(m.revenue || 0);
                  const isTop = rev > 0 && rev === maxMonthRev;
                  const heightPct = rev > 0 ? Math.max(12, Math.round((rev / maxMonthRev) * 100)) : 0;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                      {isTop && (
                        <span className="text-[11px] sm:text-xs font-semibold text-[#1f2421] mb-1.5 whitespace-nowrap">
                          {rev.toLocaleString()}
                        </span>
                      )}
                      {rev > 0 ? (
                        <div
                          className="w-full max-w-[54px] bg-[#1e382b] rounded-t-lg transition-all duration-500"
                          style={{ height: `${heightPct}%` }}
                        />
                      ) : (
                        <div className="w-full max-w-[54px] h-1.5 bg-[#d6cec3] rounded-full mb-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Month Labels below axis */}
              <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 pt-2.5">
                {monthlyData.map((m, idx) => (
                  <div key={idx} className="flex-1 text-center text-xs text-[#7a6f60] font-medium">
                    {m.month}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Split 2-Column Overview (Halls & Total Bookings) */}
          <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 grid grid-cols-2 divide-x divide-[#e5ded4] shadow-2xs">
            <div>
              <p className="font-serif text-3xl sm:text-4xl text-[#1f2421] font-normal">
                {data.myHallsCount || 0}
              </p>
              <p className="text-xs text-[#7a6f60] font-normal mt-1">Registered halls</p>
            </div>
            <div className="pl-6 sm:pl-8">
              <p className="font-serif text-3xl sm:text-4xl text-[#1f2421] font-normal">
                {data.totalBookings || 0}
              </p>
              <p className="text-xs text-[#7a6f60] font-normal mt-1">
                Bookings in total · {data.confirmedBookings || 0} confirmed · {data.holdBookings || 0} on hold
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: TODAY (Deep Racing Green with Amber button) */}
          <div className="rounded-2xl bg-[#1e382b] text-white p-6 space-y-4 shadow-sm">
            <p className="text-[10px] tracking-widest font-bold uppercase text-[#c28e36]">
              TODAY
            </p>

            {todayEvent ? (
              <div className="space-y-3">
                <h3 className="font-serif text-2xl text-white leading-tight font-normal capitalize">
                  {todayEvent.eventType?.toLowerCase() || "Barat"}, {todayEvent.customerName}
                </h3>
                <p className="text-xs text-white/70 font-normal">
                  {todayEvent.hall?.name || "Jan wedding hall"}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white capitalize">
                    {todayIsNight ? "Night session" : "Day session"}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white capitalize">
                    {todayEvent.eventType?.toLowerCase() || "Barat"}
                  </span>
                </div>

                <Link
                  href="/dashboard/bookings"
                  className="block w-full text-center rounded-xl bg-[#c28e36] hover:bg-[#b07d2c] text-[#1f2421] font-bold py-2.5 text-sm transition mt-3 shadow-xs"
                >
                  Open booking
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-serif text-2xl text-white leading-tight font-normal">
                  No events today
                </h3>
                <p className="text-xs text-white/70 font-normal">
                  All your registered halls are currently available today.
                </p>
                <Link
                  href="/dashboard/calendar"
                  className="block w-full text-center rounded-xl bg-[#c28e36] hover:bg-[#b07d2c] text-[#1f2421] font-bold py-2.5 text-sm transition mt-3 shadow-xs"
                >
                  Check availability
                </Link>
              </div>
            )}
          </div>

          {/* Card 2: Upcoming Events */}
          <div className="rounded-2xl border border-[#e5ded4] bg-[#faf7f2] p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-[#1f2421] font-normal">Upcoming</h3>
                <p className="text-xs text-[#7a6f60] font-normal mt-0.5">Next scheduled events</p>
              </div>
              <Link
                href="/dashboard/bookings"
                className="text-xs font-bold text-[#1f2421] underline hover:text-[#1e382b]"
              >
                All bookings
              </Link>
            </div>

            <div className="border-t border-[#e5ded4]" />

            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((evt) => {
                  let parsedDate = new Date();
                  try {
                    const p = parseISO(evt.eventDate);
                    if (isValid(p)) parsedDate = p;
                  } catch {
                    // fallback
                  }
                  const isNight = evt.notes?.includes("[SESSION:NIGHT]");

                  return (
                    <div key={evt.id} className="flex items-center gap-3.5 py-1">
                      <div className="w-13 h-13 rounded-xl border border-[#e5ded4] bg-white flex flex-col items-center justify-center shrink-0 shadow-2xs">
                        <span className="font-bold text-base text-[#1f2421] leading-none">
                          {format(parsedDate, "d")}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-[#7a6f60] mt-0.5 leading-none">
                          {format(parsedDate, "MMM")}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1f2421] truncate">{evt.customerName}</p>
                        <p className="text-xs text-[#7a6f60] truncate mt-0.5">
                          {evt.hall?.name || "Jan wedding hall"} · {isNight ? "Night" : "Day"} · {evt.eventType || "Barat"}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-[#7a6f60] py-4 text-center">No upcoming events scheduled yet.</p>
              )}
            </div>

            <div className="border-t border-[#e5ded4]" />

            <p className="text-xs text-[#7a6f60] text-center pt-1 font-normal">
              Nothing else is scheduled yet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
