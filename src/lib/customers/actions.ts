"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { insertCustomer } from "@/lib/customers/db";

export type ActionState = { error: string } | { success: true } | null;

// Both roles can create customers; only Admin can edit/delete an existing
// one (enforced again at the DB via RLS on the `customers` table).
export async function createCustomerAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(["ADMIN", "STAFF"]);

  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!fullName) {
    return { error: "Customer name is required." };
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await insertCustomer(supabase, {
    fullName,
    phone: String(formData.get("phone") ?? "").trim(),
    whatsappNumber: String(formData.get("whatsappNumber") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    referenceName: String(formData.get("referenceName") ?? "").trim(),
    referencePhone: String(formData.get("referencePhone") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath("/bookings/new");
  return { success: true };
}
