// One-time bootstrap for the very first ADMIN account.
// There is no public sign-up in this app — every other account (Employees,
// and any additional Admins) is created afterwards from the /admin panel,
// which requires an existing Admin to be logged in. This script exists only
// to solve the chicken-and-egg problem of creating that first Admin.
//
// Usage:
//   npm run create-admin -- --email admin@hall.com --name "Hall Manager" --password "a-strong-password"
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

function parseArgs() {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      result[key] = args[i + 1];
      i += 1;
    }
  }
  return result;
}

async function main() {
  const { email, name, password, phone } = parseArgs();

  if (!email || !name || !password) {
    console.error('Usage: npm run create-admin -- --email admin@hall.com --name "Hall Manager" --password "a-strong-password"');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    console.error("Failed to create auth user:", authError?.message);
    process.exit(1);
  }

  const { error: profileError } = await supabase.from("users").insert({
    auth_user_id: authUser.user.id,
    email,
    full_name: name,
    phone: phone || null,
    role: "ADMIN",
  });

  if (profileError) {
    console.error("Failed to create user profile, rolling back auth user:", profileError.message);
    await supabase.auth.admin.deleteUser(authUser.user.id);
    process.exit(1);
  }

  console.log(`Admin account created: ${email}`);
}

main();
