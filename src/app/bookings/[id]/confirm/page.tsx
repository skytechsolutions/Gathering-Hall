import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ConfirmForm } from "./confirm-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ConfirmBookingPage({ params }: Props) {
  await requireRole(["ADMIN"]);
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, booking_number, booking_date, day_name, shift, event_type, status, guest_count, male_waiter_required, male_waiter_quantity, female_waiter_required, female_waiter_quantity, dj_required, stage_required, notes, customers(full_name, phone)",
    )
    .eq("id", id)
    .single();

  if (!booking) {
    notFound();
  }

  if (booking.status !== "HOLD") {
    redirect("/bookings");
  }

  const customer = Array.isArray(booking.customers) ? booking.customers[0] : booking.customers;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Bookings</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Confirm Booking {booking.booking_number}</h1>
        <p className="mt-1 text-sm text-mute">
          {customer?.full_name} · {booking.booking_date} ({booking.day_name}) · {booking.shift === "DAY" ? "Day" : "Night"} — fill in the event details to confirm.
        </p>
      </div>

      <ConfirmForm booking={booking} />
    </div>
  );
}
