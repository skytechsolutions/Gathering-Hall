import { getMonthAvailability } from "@/lib/booking/availability";
import { MonthNav } from "@/components/month-nav";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// One muted hue per event category, matching the tokens used on the
// Bookings table and Reports page — kept consistent so a color means the
// same thing everywhere in the app.
const EVENT_COLORS: Record<string, string> = {
  Barat: "bg-event-barat/15 text-event-barat",
  Walima: "bg-event-walima/15 text-event-walima",
  Mehndi: "bg-event-mehndi/15 text-event-mehndi",
  Mayoun: "bg-event-mayoun/15 text-event-mayoun",
  Nikkah: "bg-event-nikkah/15 text-event-nikkah",
  Engagement: "bg-event-engagement/15 text-event-engagement",
  Dholki: "bg-event-dholki/15 text-event-dholki",
  Birthday: "bg-event-birthday/15 text-event-birthday",
  "Corporate Event": "bg-event-corporate/15 text-event-corporate",
  Other: "bg-event-other/15 text-event-other",
};

function pillStyle(status: string, eventType: string | null) {
  if (status === "HOLD") return "bg-accent-blue/10 text-accent-blue";
  if (eventType && EVENT_COLORS[eventType]) return EVENT_COLORS[eventType];
  return "bg-success-pale text-success-deep";
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type Props = { year: number; month: number };

// Month grid, read-only at a glance: which dates still have an open Day
// or Night slot vs. which are Hold/Confirmed, color-coded by event type.
// Weekend columns get a cream background so Fri/Sat/Sun bookings (the
// busiest days for this hall) stand out immediately.
export async function BookingCalendar({ year, month }: Props) {
  const bookings = await getMonthAvailability(year, month);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  const byDate = new Map<string, { shift: string; status: string; event_type: string | null }[]>();
  for (const booking of bookings) {
    const list = byDate.get(booking.booking_date) ?? [];
    list.push(booking);
    byDate.set(booking.booking_date, list);
  }

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = localDateKey(new Date());

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 shadow-sm sm:rounded-[32px] sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink sm:text-xl">{monthLabel}</h2>
        <MonthNav prevHref={`/dashboard?year=${prev.year}&month=${prev.month}`} nextHref={`/dashboard?year=${next.year}&month=${next.month}`} />
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-mute sm:gap-1.5 sm:text-xs">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={label} className={`rounded-lg py-1.5 ${i === 0 || i === 6 ? "bg-surface-card text-body" : ""}`}>
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((day, idx) => {
          const col = idx % 7;
          const isWeekend = col === 0 || col === 6;

          if (day === null) {
            return <div key={idx} className="aspect-square rounded-lg sm:aspect-auto sm:h-16 sm:rounded-xl" />;
          }

          const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayBookings = byDate.get(dateKey) ?? [];
          const dayShift = dayBookings.find((b) => b.shift === "DAY");
          const nightShift = dayBookings.find((b) => b.shift === "NIGHT");
          const isToday = dateKey === todayKey;

          return (
            <div
              key={idx}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border p-1 sm:aspect-auto sm:h-16 sm:rounded-xl sm:p-1.5 ${
                isToday ? "border-primary" : isWeekend ? "border-transparent bg-surface-card" : "border-transparent bg-canvas"
              }`}
            >
              <span className={`text-[11px] font-bold sm:text-xs ${isToday ? "text-primary" : "text-ink"}`}>{day}</span>
              <div className="flex gap-0.5">
                {dayShift ? (
                  <span className={`rounded px-1 text-[8px] font-bold leading-tight sm:text-[9px] ${pillStyle(dayShift.status, dayShift.event_type)}`}>
                    D
                  </span>
                ) : null}
                {nightShift ? (
                  <span className={`rounded px-1 text-[8px] font-bold leading-tight sm:text-[9px] ${pillStyle(nightShift.status, nightShift.event_type)}`}>
                    N
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
