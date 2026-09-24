import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/permissions";
import { rejectBookingAction, cancelBookingAction, deleteBookingAction } from "@/lib/booking/actions";

const STATUS_STYLES: Record<string, string> = {
  HOLD: "bg-accent-blue/10 text-accent-blue",
  CONFIRMED: "bg-success-pale text-success-deep",
  COMPLETED: "bg-secondary-bg text-body",
  CANCELLED: "bg-error/10 text-error",
  REJECTED: "bg-error/10 text-error",
};

export default async function BookingsPage() {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const admin = isAdmin(user.role);

  return (
    <div className="space-y-6">
      <div className="hidden justify-end sm:flex">
        <Link href="/bookings/new" className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-pressed">
          New Booking
        </Link>
      </div>

      <BookingsTable admin={admin} />

      {!admin ? (
        <p className="text-xs text-mute">
          As staff you can create new Hold bookings, but only an admin can confirm, reject, cancel, edit, or delete a booking.
        </p>
      ) : null}
    </div>
  );
}

type Booking = {
  id: string;
  booking_date: string;
  day_name: string | null;
  shift: string;
  event_type: string | null;
  status: string;
  customers: { full_name: string; phone: string | null } | { full_name: string; phone: string | null }[] | null;
};

function getCustomer(booking: Booking) {
  return Array.isArray(booking.customers) ? booking.customers[0] : booking.customers;
}

function BookingActions({ booking, admin }: { booking: Booking; admin: boolean }) {
  if (!admin) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {booking.status === "HOLD" ? (
        <>
          <Link href={`/bookings/${booking.id}/confirm`} className="rounded-full bg-success-pale px-3 py-1 text-xs font-bold text-success-deep hover:brightness-95">
            Confirm
          </Link>
          <form action={rejectBookingAction.bind(null, booking.id)}>
            <button className="rounded-full bg-error/10 px-3 py-1 text-xs font-bold text-error hover:bg-error/15">Reject</button>
          </form>
        </>
      ) : null}
      {booking.status === "CONFIRMED" ? (
        <form action={cancelBookingAction.bind(null, booking.id)}>
          <button className="rounded-full bg-error/10 px-3 py-1 text-xs font-bold text-error hover:bg-error/15">Cancel</button>
        </form>
      ) : null}
      <Link href={`/bookings/${booking.id}/edit`} className="rounded-full bg-secondary-bg px-3 py-1 text-xs font-bold text-ink hover:bg-secondary-pressed">
        Edit
      </Link>
      <form action={deleteBookingAction.bind(null, booking.id)}>
        <button className="rounded-full border border-hairline px-3 py-1 text-xs font-bold text-mute hover:bg-surface-card">Delete</button>
      </form>
    </div>
  );
}

async function BookingsTable({ admin }: { admin: boolean }) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("bookings")
    .select("id, booking_date, day_name, shift, event_type, status, customers(full_name, phone)")
    .order("booking_date", { ascending: true });

  const bookings = (data ?? []) as Booking[];

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-hairline bg-canvas p-8 text-center text-sm text-mute shadow-sm sm:rounded-[32px]">
        No bookings yet.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: one card per booking — a 7-column table doesn't fit a phone
          screen without confusing horizontal scrolling, so this is the
          primary layout below sm:. */}
      <div className="space-y-3 sm:hidden">
        {bookings.map((booking) => {
          const customer = getCustomer(booking);
          return (
            <div key={booking.id} className="rounded-2xl border border-hairline bg-canvas p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{customer?.full_name}</p>
                  <p className="text-xs text-mute">{customer?.phone}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[booking.status] ?? "bg-surface-card text-body"}`}>
                  {booking.status}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-surface-card px-2 py-2">
                  <p className="text-[10px] font-semibold uppercase text-mute">Date</p>
                  <p className="text-xs font-bold text-ink">{booking.booking_date.slice(5)}</p>
                </div>
                <div className="rounded-xl bg-surface-card px-2 py-2">
                  <p className="text-[10px] font-semibold uppercase text-mute">Day</p>
                  <p className="text-xs font-bold text-ink">{booking.day_name?.slice(0, 3) ?? "—"}</p>
                </div>
                <div className="rounded-xl bg-surface-card px-2 py-2">
                  <p className="text-[10px] font-semibold uppercase text-mute">Shift</p>
                  <p className="text-xs font-bold text-ink">{booking.shift}</p>
                </div>
              </div>

              <p className="mt-2 text-xs text-body">
                Event: <span className="font-semibold text-ink">{booking.event_type ?? "Not decided"}</span>
              </p>

              {admin ? <div className="mt-3">{<BookingActions booking={booking} admin={admin} />}</div> : null}
            </div>
          );
        })}
      </div>

      {/* Desktop: full table */}
      <div className="hidden overflow-hidden rounded-[32px] border border-hairline bg-canvas shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-card text-body">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Name</th>
                <th className="px-5 py-3.5 font-semibold">Date</th>
                <th className="px-5 py-3.5 font-semibold">Day</th>
                <th className="px-5 py-3.5 font-semibold">Shift</th>
                <th className="px-5 py-3.5 font-semibold">Event</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                {admin ? <th className="px-5 py-3.5 font-semibold">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const customer = getCustomer(booking);
                return (
                  <tr key={booking.id} className="border-t border-hairline-soft transition hover:bg-surface-soft">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink">{customer?.full_name}</p>
                      <p className="text-xs text-mute">{customer?.phone}</p>
                    </td>
                    <td className="px-5 py-4 text-body">{booking.booking_date}</td>
                    <td className="px-5 py-4 text-body">{booking.day_name}</td>
                    <td className="px-5 py-4 text-body">{booking.shift}</td>
                    <td className="px-5 py-4 text-body">{booking.event_type ?? <span className="text-mute">—</span>}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[booking.status] ?? "bg-surface-card text-body"}`}>
                        {booking.status}
                      </span>
                    </td>
                    {admin ? (
                      <td className="px-5 py-4">
                        <BookingActions booking={booking} admin={admin} />
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
