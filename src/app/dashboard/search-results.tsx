import { createSupabaseServerClient } from "@/lib/supabase/server";

const STATUS_STYLES: Record<string, string> = {
  HOLD: "bg-accent-blue/10 text-accent-blue",
  CONFIRMED: "bg-success-pale text-success-deep",
  COMPLETED: "bg-secondary-bg text-body",
  CANCELLED: "bg-error/10 text-error",
  REJECTED: "bg-error/10 text-error",
};

export async function SearchResults({ date, name, phone }: { date?: string; name?: string; phone?: string }) {
  const supabase = await createSupabaseServerClient();

  const needsCustomerFilter = Boolean(name || phone);
  let query = supabase
    .from("bookings")
    .select(
      needsCustomerFilter
        ? "id, booking_number, booking_date, day_name, shift, event_type, status, guest_count, customers!inner(full_name, phone)"
        : "id, booking_number, booking_date, day_name, shift, event_type, status, guest_count, customers(full_name, phone)",
    )
    .order("booking_date", { ascending: true });

  if (date) query = query.eq("booking_date", date);
  if (name) query = query.ilike("customers.full_name", `%${name}%`);
  if (phone) query = query.ilike("customers.phone", `%${phone}%`);

  const { data: bookings } = await query;

  return (
    <div className="rounded-[32px] border border-hairline bg-canvas shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-card text-body">
            <tr>
              <th className="px-4 py-3 font-semibold">Booking #</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Day</th>
              <th className="px-4 py-3 font-semibold">Shift</th>
              <th className="px-4 py-3 font-semibold">Event</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {(bookings ?? []).map((booking) => {
              const customer = Array.isArray(booking.customers) ? booking.customers[0] : booking.customers;
              return (
                <tr key={booking.id} className="border-t border-hairline-soft">
                  <td className="px-4 py-3 font-medium text-ink">{booking.booking_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{customer?.full_name}</p>
                    <p className="text-xs text-mute">{customer?.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-body">{booking.booking_date}</td>
                  <td className="px-4 py-3 text-body">{booking.day_name}</td>
                  <td className="px-4 py-3 text-body">{booking.shift}</td>
                  <td className="px-4 py-3 text-body">{booking.event_type ?? <span className="text-mute">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[booking.status] ?? "bg-surface-card text-body"}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(bookings ?? []).length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-mute">No bookings match this search.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
