import { requireRole } from "@/lib/auth/session";
import { getMonthAvailability } from "@/lib/booking/availability";
import { MonthNav } from "@/components/month-nav";
import { StatCard } from "@/components/stat-card";

const EVENT_TYPES = ["Barat", "Walima", "Mehndi", "Mayoun", "Nikkah", "Engagement", "Dholki", "Birthday", "Corporate Event", "Other"];

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type Props = {
  searchParams: Promise<{ year?: string; month?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  await requireRole(["ADMIN"]);
  const params = await searchParams;

  const now = new Date();
  const year = Number(params.year) || now.getFullYear();
  const month = Number(params.month) || now.getMonth() + 1;
  const todayKey = localDateKey(now);

  const bookings = await getMonthAvailability(year, month);

  const total = bookings.length;
  const dayCount = bookings.filter((b) => b.shift === "DAY").length;
  const nightCount = bookings.filter((b) => b.shift === "NIGHT").length;
  const completedCount = bookings.filter((b) => b.booking_date < todayKey).length;
  const upcomingCount = bookings.filter((b) => b.booking_date >= todayKey).length;

  const eventTypeCounts = EVENT_TYPES.map((type) => ({
    type,
    count: bookings.filter((b) => b.event_type === type).length,
  }));
  const undecidedCount = bookings.filter((b) => !b.event_type).length;

  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Reports</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Monthly Report</h1>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-hairline bg-canvas p-4 shadow-sm sm:rounded-[32px] sm:p-6">
        <h2 className="text-lg font-bold text-ink sm:text-xl">{monthLabel}</h2>
        <MonthNav prevHref={`/reports?year=${prev.year}&month=${prev.month}`} nextHref={`/reports?year=${next.year}&month=${next.month}`} />
      </div>

      <div className="rounded-2xl bg-ink p-5 text-center shadow-sm sm:rounded-[32px] sm:p-6">
        <p className="text-4xl font-bold text-white sm:text-5xl">{total}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/70">Total Bookings</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Day" value={dayCount} tone="neutral" />
        <StatCard label="Night" value={nightCount} tone="neutral" />
        <StatCard label="Completed" value={completedCount} tone="muted" />
        <StatCard label="Upcoming" value={upcomingCount} tone="accent" />
      </div>

      <div className="rounded-2xl border border-hairline bg-canvas p-4 shadow-sm sm:rounded-[32px] sm:p-6">
        <h2 className="text-lg font-bold text-ink">By Event Type</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {eventTypeCounts.map(({ type, count }) => (
            <div key={type} className="rounded-2xl bg-surface-card p-3 text-center">
              <p className="text-2xl font-bold text-ink">{count}</p>
              <p className="text-xs font-semibold text-mute">{type}</p>
            </div>
          ))}
          {undecidedCount > 0 ? (
            <div className="rounded-2xl bg-surface-card p-3 text-center">
              <p className="text-2xl font-bold text-ink">{undecidedCount}</p>
              <p className="text-xs font-semibold text-mute">Not decided yet</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
