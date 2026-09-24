import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS entirely — only ever import this from
// server actions/scripts that have already checked the caller is ADMIN.
// Never import this from a Client Component or expose it to the browser.
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service-role environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
