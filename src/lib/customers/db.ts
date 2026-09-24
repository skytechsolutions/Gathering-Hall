import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NewCustomerInput = {
  fullName: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  referenceName?: string;
  referencePhone?: string;
  notes?: string;
};

// Shared by the Customers page's "Add Customer" form and the New Booking
// form's inline "new customer" section, so both paths create rows the same
// way (and both go through the session-bound client, so RLS still applies).
export async function insertCustomer(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, input: NewCustomerInput) {
  return supabase
    .from("customers")
    .insert({
      full_name: input.fullName,
      phone: input.phone || null,
      whatsapp_number: input.whatsappNumber || null,
      address: input.address || null,
      reference_name: input.referenceName || null,
      reference_phone: input.referencePhone || null,
      notes: input.notes || null,
    })
    .select("id")
    .single();
}
