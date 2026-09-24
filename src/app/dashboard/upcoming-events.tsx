import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_STYLES: Record<string, string> = {
  HOLD: "bg-accent-blue/10 text-accent-blue",
  CONFIRMED: "bg-success-pale text-success-deep",
};

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Every active (Hold/Confirmed) booking in the next 30 days, soonest
// first — this is what staff check daily: what's tomorrow, what's this
// week, what's coming up over the next month. No month grid to scan, just
// the list.
export async function UpcomingEvents() {
  const supabase = await createSupabaseServerClient();

  const today = new Date();
  const monthAhead = new Date();
  monthAhead.setDate(monthAhead.getDate() + 30);
  const todayKey = localDateKey(today);
  const monthAheadKey = localDateKey(monthAhead);

  const { data: events } = await supabase
    .from("bookings")
    .select("id, booking_date, day_name, shift, event_type, status, customers(full_name, phone)")
    .gte("booking_date", todayKey)
    .lte("booking_date", monthAheadKey)
    .in("status", ["HOLD", "CONFIRMED"])
    .order("booking_date", { ascending: true })
    .order("shift", { ascending: true });

  return (
    <div className="rounded-2xl border border-hairline bg-canvas p-4 shadow-sm sm:rounded-[32px] sm:p-6">
      <div className="flex items-center justify-end">
        <span className="rounded-full bg-surface-card px-3 py-1 text-xs font-semibold text-mute">Next 30 days</span>
      </div>

      {(events ?? []).length === 0 ? (
        <p className="mt-4 text-sm text-mute">No upcoming bookings.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {(events ?? []).map((event) => {
            const customer = Array.isArray(event.customers) ? event.customers[0] : event.customers;
            const isToday = event.booking_date === todayKey;
            return (
              <div
                key={event.id}
                className={`flex items-center gap-3 rounded-2xl border p-2.5 sm:p-3 ${isToday ? "border-primary/30 bg-primary/5" : "border-hairline-soft"}`}
              >
                <div className={`flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl ${isToday ? "bg-primary text-white" : "bg-surface-card text-ink"}`}>
                  <span className="text-[9px] font-bold uppercase leading-none opacity-80">{event.day_name?.slice(0, 3)}</span>
                  <span className="text-sm font-bold leading-tight">{event.booking_date.slice(8)}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {customer?.full_name} <span className="font-normal text-mute">— {event.event_type ?? "TBD"}</span>
                  </p>
                  <p className="truncate text-xs text-mute">{event.shift === "DAY" ? "Day" : "Night"} · {customer?.phone}</p>
                </div>

                <span className={`flex-shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide sm:px-2.5 sm:text-[10px] ${STATUS_STYLES[event.status] ?? "bg-surface-card text-body"}`}>
                  {event.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
