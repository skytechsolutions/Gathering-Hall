import { getMonthAvailability } from "@/lib/booking/availability";
import { StatCard } from "@/components/stat-card";

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Quick "how's this month going" glance below the Upcoming list — the
// same Day/Night/Completed/Upcoming counts as the Reports page's stat
// cards, just for the current month with no month picker. The full
// month-by-month picture with event-type breakdown still lives on
// Reports.
export async function MonthSummary() {
  const now = new Date();
  const bookings = await getMonthAvailability(now.getFullYear(), now.getMonth() + 1);
  const todayKey = localDateKey(now);

  const total = bookings.length;
  const dayCount = bookings.filter((b) => b.shift === "DAY").length;
  const nightCount = bookings.filter((b) => b.shift === "NIGHT").length;
  const completed = bookings.filter((b) => b.booking_date < todayKey).length;
  const remaining = bookings.filter((b) => b.booking_date >= todayKey).length;
  const monthLabel = now.toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wide text-mute">{monthLabel} so far</h2>

      <div className="rounded-2xl bg-ink p-5 text-center shadow-sm sm:rounded-[32px] sm:p-6">
        <p className="text-4xl font-bold text-white sm:text-5xl">{total}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/70">Total Bookings</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Day" value={dayCount} tone="neutral" />
        <StatCard label="Night" value={nightCount} tone="neutral" />
        <StatCard label="Completed" value={completed} tone="muted" />
        <StatCard label="Remaining" value={remaining} tone="accent" />
      </div>
    </div>
  );
}
