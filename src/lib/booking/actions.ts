"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { enforceBookingMutation } from "@/lib/booking/booking-rules";
import { getSlotAvailability, type BookingShift } from "@/lib/booking/availability";
import { insertCustomer } from "@/lib/customers/db";
import type { BookingStatus } from "@/lib/auth/permissions";

export type ActionState = { error: string } | { success: true } | null;

async function logActivity(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  bookingId: string,
  action: string,
  details: Record<string, unknown> = {},
) {
  await supabase.from("activity_logs").insert({
    user_id: userId,
    booking_id: bookingId,
    action,
    details,
  });
}

async function resolveCustomerId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  formData: FormData,
): Promise<{ customerId: string } | { error: string }> {
  const customerId = String(formData.get("customerId") ?? "");
  const newCustomerName = String(formData.get("newCustomerName") ?? "").trim();

  if (customerId) {
    return { customerId };
  }
  if (!newCustomerName) {
    return { error: "Select an existing customer or enter a new customer's name." };
  }

  const { data: newCustomer, error } = await insertCustomer(supabase, {
    fullName: newCustomerName,
    phone: String(formData.get("newCustomerPhone") ?? "").trim(),
    address: String(formData.get("newCustomerAddress") ?? "").trim(),
    referenceName: String(formData.get("newCustomerReferenceName") ?? "").trim(),
    referencePhone: String(formData.get("newCustomerReferencePhone") ?? "").trim(),
  });
  if (error || !newCustomer) {
    return { error: error?.message ?? "Could not create the new customer." };
  }
  return { customerId: newCustomer.id };
}

// Staff may only ever create HOLD bookings attributed to themselves.
// This mirrors the DB-level RLS check on `bookings` (belt and suspenders —
// even if this app-level check were removed, the insert would still be
// rejected by Postgres).
//
// A HOLD only needs a customer and up to 3 candidate dates — no event
// details yet, those are collected later when it's confirmed (see
// confirmBookingWithDetailsAction). A CONFIRMED booking is created with
// full details up front, for the case where the customer already knows
// exactly what they want on one specific date.
export async function createBookingAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["ADMIN", "STAFF"]);

  const access = enforceBookingMutation("create", { userRole: user.role });
  if (!access.ok) {
    return { error: access.message };
  }

  const requestedStatus = String(formData.get("status") ?? "HOLD");
  const status: BookingStatus = user.role === "ADMIN" && requestedStatus === "CONFIRMED" ? "CONFIRMED" : "HOLD";

  const supabase = await createSupabaseServerClient();

  const customerResult = await resolveCustomerId(supabase, formData);
  if ("error" in customerResult) {
    return { error: customerResult.error };
  }
  const { customerId } = customerResult;

  if (status === "CONFIRMED") {
    const bookingDate = String(formData.get("bookingDate") ?? "");
    const shift = String(formData.get("shift") ?? "");
    const eventType = String(formData.get("eventType") ?? "").trim();
    const guestCount = Number(formData.get("guestCount") ?? 0);
    const maleWaiterRequired = formData.get("maleWaiterRequired") === "on";
    const maleWaiterQuantity = maleWaiterRequired ? Number(formData.get("maleWaiterQuantity") ?? 0) : 0;
    const femaleWaiterRequired = formData.get("femaleWaiterRequired") === "on";
    const femaleWaiterQuantity = femaleWaiterRequired ? Number(formData.get("femaleWaiterQuantity") ?? 0) : 0;
    const djRequired = formData.get("djRequired") === "on";
    const stageRequired = formData.get("stageRequired") === "on";
    const notes = String(formData.get("notes") ?? "");

    if (!bookingDate || !shift || !eventType) {
      return { error: "Date, shift, and event type are required for a confirmed booking." };
    }

    const availability = await getSlotAvailability(bookingDate, shift as BookingShift);
    if (availability.status !== "AVAILABLE") {
      return {
        error: `${bookingDate} (${shift}) is already ${availability.status === "CONFIRMED" ? "confirmed" : "held"} — pick another date or shift.`,
      };
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: customerId,
        booking_date: bookingDate,
        shift,
        event_type: eventType,
        status: "CONFIRMED",
        guest_count: guestCount,
        male_waiter_required: maleWaiterRequired,
        male_waiter_quantity: maleWaiterQuantity,
        female_waiter_required: femaleWaiterRequired,
        female_waiter_quantity: femaleWaiterQuantity,
        dj_required: djRequired,
        stage_required: stageRequired,
        created_by: user.id,
        confirmed_by: user.id,
        notes: notes || null,
      })
      .select("id")
      .single();

    if (error || !data) {
      if (error?.code === "23505") {
        return { error: "That date/shift was just taken by another booking." };
      }
      return { error: error?.message ?? "Could not create booking." };
    }

    await logActivity(supabase, user.id, data.id, "BOOKING_CREATED", { status: "CONFIRMED", bookingDate, shift });
    revalidatePath("/bookings");
    return { success: true };
  }

  // HOLD path — 1 to 3 candidate dates, no event details.
  const datePairs = [1, 2, 3]
    .map((index) => ({
      date: String(formData.get(`date${index}`) ?? "").trim(),
      shift: String(formData.get(`shift${index}`) ?? "").trim(),
    }))
    .filter((pair) => pair.date && pair.shift);

  if (datePairs.length === 0) {
    return { error: "At least one date is required to place a hold." };
  }

  const seen = new Set<string>();
  for (const pair of datePairs) {
    const key = `${pair.date}|${pair.shift}`;
    if (seen.has(key)) {
      return { error: `${pair.date} (${pair.shift}) was entered more than once.` };
    }
    seen.add(key);
  }

  for (const pair of datePairs) {
    const availability = await getSlotAvailability(pair.date, pair.shift as BookingShift);
    if (availability.status !== "AVAILABLE") {
      return {
        error: `${pair.date} (${pair.shift}) is already ${availability.status === "CONFIRMED" ? "confirmed" : "held"} — remove it or pick another date.`,
      };
    }
  }

  let createdCount = 0;
  for (const pair of datePairs) {
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: customerId,
        booking_date: pair.date,
        shift: pair.shift,
        event_type: null,
        status: "HOLD",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      if (createdCount > 0) {
        return { error: `Held ${createdCount} of ${datePairs.length} date(s), but ${pair.date} failed: ${error?.message ?? "unknown error"}.` };
      }
      if (error?.code === "23505") {
        return { error: `${pair.date} (${pair.shift}) was just taken by another booking.` };
      }
      return { error: error?.message ?? "Could not place the hold." };
    }

    createdCount += 1;
    await logActivity(supabase, user.id, data.id, "BOOKING_CREATED", { status: "HOLD", bookingDate: pair.date, shift: pair.shift });
  }

  revalidatePath("/bookings");
  return { success: true };
}

// Admin-only. People keep changing the event date after the fact, so this
// covers every editable field including date/shift — re-checked against
// the slot-availability rule (excluding this booking itself) exactly like
// creation is.
export async function updateBookingAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["ADMIN"]);

  const bookingId = String(formData.get("bookingId") ?? "");
  const existingStatus = String(formData.get("existingStatus") ?? "") as BookingStatus;

  const access = enforceBookingMutation("update", { userRole: user.role, existingStatus });
  if (!access.ok) {
    return { error: access.message };
  }

  const customerId = String(formData.get("customerId") ?? "");
  const bookingDate = String(formData.get("bookingDate") ?? "");
  const shift = String(formData.get("shift") ?? "");
  const eventType = String(formData.get("eventType") ?? "").trim();
  const guestCount = Number(formData.get("guestCount") ?? 0);
  const maleWaiterRequired = formData.get("maleWaiterRequired") === "on";
  const maleWaiterQuantity = maleWaiterRequired ? Number(formData.get("maleWaiterQuantity") ?? 0) : 0;
  const femaleWaiterRequired = formData.get("femaleWaiterRequired") === "on";
  const femaleWaiterQuantity = femaleWaiterRequired ? Number(formData.get("femaleWaiterQuantity") ?? 0) : 0;
  const djRequired = formData.get("djRequired") === "on";
  const stageRequired = formData.get("stageRequired") === "on";
  const notes = String(formData.get("notes") ?? "");

  if (!bookingId || !customerId || !bookingDate || !shift) {
    return { error: "Customer, date, and shift are required." };
  }
  if (existingStatus === "CONFIRMED" && !eventType) {
    return { error: "Event type is required for a confirmed booking." };
  }

  const availability = await getSlotAvailability(bookingDate, shift as BookingShift, bookingId);
  if (availability.status !== "AVAILABLE") {
    return {
      error: `${bookingDate} (${shift}) is already ${availability.status === "CONFIRMED" ? "confirmed" : "held"} — pick another date or shift.`,
    };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      customer_id: customerId,
      booking_date: bookingDate,
      shift,
      event_type: eventType || null,
      guest_count: guestCount,
      male_waiter_required: maleWaiterRequired,
      male_waiter_quantity: maleWaiterQuantity,
      female_waiter_required: femaleWaiterRequired,
      female_waiter_quantity: femaleWaiterQuantity,
      dj_required: djRequired,
      stage_required: stageRequired,
      notes: notes || null,
    })
    .eq("id", bookingId);

  if (error) {
    if (error.code === "23505") {
      return { error: "That date/shift was just taken by another booking." };
    }
    return { error: error.message };
  }

  await logActivity(supabase, user.id, bookingId, "BOOKING_UPDATED", { bookingDate, shift });

  revalidatePath("/bookings");
  return { success: true };
}

// Admin-only. Promotes a HOLD to CONFIRMED — this is where the event
// details a Hold never collected (event type, waiters, DJ, stage, amounts)
// finally get filled in. No availability re-check needed: this row already
// owns its date/shift under uq_bookings_active_slot, so there is nothing
// to collide with.
export async function confirmBookingWithDetailsAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole(["ADMIN"]);

  const bookingId = String(formData.get("bookingId") ?? "");
  const access = enforceBookingMutation("confirm", { userRole: user.role });
  if (!access.ok) {
    return { error: access.message };
  }

  const eventType = String(formData.get("eventType") ?? "").trim();
  const guestCount = Number(formData.get("guestCount") ?? 0);
  const maleWaiterRequired = formData.get("maleWaiterRequired") === "on";
  const maleWaiterQuantity = maleWaiterRequired ? Number(formData.get("maleWaiterQuantity") ?? 0) : 0;
  const femaleWaiterRequired = formData.get("femaleWaiterRequired") === "on";
  const femaleWaiterQuantity = femaleWaiterRequired ? Number(formData.get("femaleWaiterQuantity") ?? 0) : 0;
  const djRequired = formData.get("djRequired") === "on";
  const stageRequired = formData.get("stageRequired") === "on";
  const notes = String(formData.get("notes") ?? "");

  if (!bookingId || !eventType) {
    return { error: "Event type is required to confirm this booking." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "CONFIRMED",
      confirmed_by: user.id,
      event_type: eventType,
      guest_count: guestCount,
      male_waiter_required: maleWaiterRequired,
      male_waiter_quantity: maleWaiterQuantity,
      female_waiter_required: femaleWaiterRequired,
      female_waiter_quantity: femaleWaiterQuantity,
      dj_required: djRequired,
      stage_required: stageRequired,
      notes: notes || null,
    })
    .eq("id", bookingId)
    .eq("status", "HOLD");

  if (error) {
    return { error: error.message };
  }

  await logActivity(supabase, user.id, bookingId, "BOOKING_CONFIRMED", { eventType });

  revalidatePath("/bookings");
  return { success: true };
}

// These three are bound to bookingId and used directly as plain <form
// action={...}> handlers (no useActionState/client component involved), so
// they must return void — failures throw instead, surfaced via the nearest
// error boundary. The permission check (enforceBookingMutation) still runs
// first, and requireRole(["ADMIN"]) still throws for a non-admin caller;
// the DB-level RLS policy is the real backstop either way.
async function transitionBookingStatus(
  bookingId: string,
  action: "reject" | "cancel" | "delete",
  nextStatus: BookingStatus | null,
): Promise<void> {
  const user = await requireRole(["ADMIN"]);

  const access = enforceBookingMutation(action, { userRole: user.role });
  if (!access.ok) {
    throw new Error(access.message);
  }

  const supabase = await createSupabaseServerClient();

  if (action === "delete") {
    const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
    if (error) {
      throw new Error(error.message);
    }
    await logActivity(supabase, user.id, bookingId, "BOOKING_DELETED");
    revalidatePath("/bookings");
    return;
  }

  const { error } = await supabase.from("bookings").update({ status: nextStatus }).eq("id", bookingId);

  if (error) {
    throw new Error(error.message);
  }

  await logActivity(supabase, user.id, bookingId, `BOOKING_${action.toUpperCase()}D`);

  revalidatePath("/bookings");
}

export async function rejectBookingAction(bookingId: string): Promise<void> {
  return transitionBookingStatus(bookingId, "reject", "REJECTED");
}

export async function cancelBookingAction(bookingId: string): Promise<void> {
  return transitionBookingStatus(bookingId, "cancel", "CANCELLED");
}

export async function deleteBookingAction(bookingId: string): Promise<void> {
  return transitionBookingStatus(bookingId, "delete", null);
}
