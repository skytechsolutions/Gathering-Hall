import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BookingShift = "DAY" | "NIGHT";
export type SlotStatus = "AVAILABLE" | "HOLD" | "CONFIRMED";

export type SlotAvailability = {
  status: SlotStatus;
  bookingId?: string;
  bookingNumber?: string;
};

export function calculateDayName(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString("en-US", { weekday: "long" });
}

// Single hall — availability is keyed purely by (date, shift). Any active
// booking (HOLD or CONFIRMED) fully occupies the slot; a second one cannot
// be created until the first is cancelled/rejected (mirrored by the DB's
// uq_bookings_active_slot unique index). Pass excludeBookingId when
// checking availability for an edit, so a booking doesn't collide with
// itself.
export async function getSlotAvailability(date: string, shift: BookingShift, excludeBookingId?: string): Promise<SlotAvailability> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("bookings")
    .select("id, booking_number, status")
    .eq("booking_date", date)
    .eq("shift", shift)
    .in("status", ["HOLD", "CONFIRMED"]);

  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { data } = await query;

  if (!data || data.length === 0) {
    return { status: "AVAILABLE" };
  }

  const confirmed = data.find((booking) => booking.status === "CONFIRMED");
  const held = confirmed ?? data[0];

  return {
    status: held.status as SlotStatus,
    bookingId: held.id,
    bookingNumber: held.booking_number ?? undefined,
  };
}

export type DateShiftAvailability = {
  shift: BookingShift;
  status: SlotStatus;
  eventType?: string | null;
  customerName?: string;
  bookingNumber?: string;
};

// Full picture for one date: both shifts, with the event/customer detail
// needed to answer "what's happening that day" at a glance.
export async function getDateAvailability(date: string): Promise<{ dayName: string; day: DateShiftAvailability; night: DateShiftAvailability }> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("bookings")
    .select("id, booking_number, shift, status, event_type, customers(full_name)")
    .eq("booking_date", date)
    .in("status", ["HOLD", "CONFIRMED"]);

  const buildShift = (shift: BookingShift): DateShiftAvailability => {
    const matches = (data ?? []).filter((booking) => booking.shift === shift);
    if (matches.length === 0) {
      return { shift, status: "AVAILABLE" };
    }
    const confirmed = matches.find((booking) => booking.status === "CONFIRMED");
    const held = confirmed ?? matches[0];
    const customer = Array.isArray(held.customers) ? held.customers[0] : held.customers;
    return {
      shift,
      status: held.status as SlotStatus,
      eventType: held.event_type,
      customerName: customer?.full_name,
      bookingNumber: held.booking_number ?? undefined,
    };
  };

  return {
    dayName: calculateDayName(date),
    day: buildShift("DAY"),
    night: buildShift("NIGHT"),
  };
}

export async function getMonthAvailability(year: number, month: number) {
  const supabase = await createSupabaseServerClient();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate).padStart(2, "0")}`;

  const { data } = await supabase
    .from("bookings")
    .select("id, booking_number, booking_date, shift, status, event_type")
    .gte("booking_date", start)
    .lte("booking_date", end)
    .in("status", ["HOLD", "CONFIRMED"]);

  return data ?? [];
}

export function calculateRemaining(total: number, paid: number): number {
  return Math.max(total - paid, 0);
}
