import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BookingForm } from "./booking-form";

export default async function NewBookingPage() {
  const user = await requireRole(["ADMIN", "STAFF"]);
  const supabase = await createSupabaseServerClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, phone")
    .order("full_name", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Bookings</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">New Booking</h1>
        <p className="mt-1 text-sm text-mute">
          {user.role === "STAFF"
            ? "This will be created as a Hold (tentative) booking. Only an admin can confirm it."
            : "As admin you can create this directly as Hold or Confirmed."}
        </p>
      </div>

      {(customers ?? []).length === 0 ? (
        <p className="rounded-2xl border border-accent-blue/20 bg-accent-blue/5 p-4 text-sm text-accent-blue">
          No customers yet. <Link href="/customers" className="font-semibold underline">Add a customer first</Link>.
        </p>
      ) : (
        <BookingForm customers={customers ?? []} isAdmin={user.role === "ADMIN"} />
      )}
    </div>
  );
}
