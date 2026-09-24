import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EditBookingForm } from "./edit-booking-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditBookingPage({ params }: Props) {
  await requireRole(["ADMIN"]);
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const [{ data: booking }, { data: customers }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        "id, customer_id, booking_date, shift, event_type, status, guest_count, male_waiter_required, male_waiter_quantity, female_waiter_required, female_waiter_quantity, dj_required, stage_required, notes, booking_number",
      )
      .eq("id", id)
      .single(),
    supabase.from("customers").select("id, full_name, phone").order("full_name", { ascending: true }),
  ]);

  if (!booking) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Bookings</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Edit Booking {booking.booking_number}</h1>
        <p className="mt-1 text-sm text-mute">
          Change the date, shift, or event details. To confirm, reject, cancel, or delete this booking, use the actions on the Booking Register.
        </p>
      </div>

      <EditBookingForm booking={booking} customers={customers ?? []} />
    </div>
  );
}
