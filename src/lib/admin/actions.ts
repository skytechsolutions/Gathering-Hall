"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/session";
import { validatePassword, validateUsername, usernameToStaffEmail } from "@/lib/auth/password";

export type CreateUserState = { error: string } | { success: true; role: "ADMIN" | "STAFF"; loginId: string } | null;

// Admin-only. There is no public sign-up — this is the only way a new
// account gets created after the initial admin is bootstrapped via
// `npm run create-admin`. Staff log in with a username (not an email —
// see usernameToStaffEmail for why); Admin logs in with a real email.
// The admin sets the password directly (rather than the system
// generating a random one) so it's a real password they chose and can
// tell the new user themselves. Uses the service-role client because
// creating a Supabase Auth user is an admin API call that RLS cannot
// govern; the requireRole check below is what actually gates it.
export async function createUserAction(_prevState: CreateUserState, formData: FormData): Promise<CreateUserState> {
  const admin = await requireRole(["ADMIN"]);

  const role = String(formData.get("role") ?? "STAFF") === "ADMIN" ? "ADMIN" : "STAFF";
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!fullName) {
    return { error: "Full name is required." };
  }
  const passwordError = validatePassword(password, confirmPassword);
  if (passwordError) {
    return { error: passwordError };
  }

  let loginEmail: string;
  let username: string | null = null;

  if (role === "ADMIN") {
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return { error: "A valid email is required for an Admin account." };
    }
    loginEmail = email;
  } else {
    username = String(formData.get("username") ?? "").trim();
    if (!username) {
      return { error: "Username is required for a Staff account." };
    }
    const usernameError = validateUsername(username);
    if (usernameError) {
      return { error: usernameError };
    }
    loginEmail = usernameToStaffEmail(username);
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: loginEmail,
    password,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    if (authError?.message.toLowerCase().includes("already been registered")) {
      return { error: role === "ADMIN" ? "That email is already registered." : "That username is already taken." };
    }
    return { error: authError?.message ?? "Could not create the account." };
  }

  const { error: profileError } = await supabaseAdmin.from("users").insert({
    auth_user_id: authUser.user.id,
    email: loginEmail,
    username,
    full_name: fullName,
    phone: phone || null,
    role,
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    if (profileError.code === "23505") {
      return { error: role === "ADMIN" ? "That email is already registered." : "That username is already taken." };
    }
    return { error: profileError.message };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: role === "ADMIN" ? "ADMIN_CREATED" : "STAFF_CREATED",
    details: { loginEmail, fullName, role },
  });

  revalidatePath("/admin");
  return { success: true, role, loginId: role === "ADMIN" ? loginEmail : (username as string) };
}

export type ResetPasswordState = { error: string } | { success: true } | null;

// Admin-only. For when a staff member forgets their password — Staff have
// no real email, so there's no self-service reset for them (that exists
// for Admin only, via /forgot-password). The admin sets the new password
// directly and tells the staff member.
export async function resetStaffPasswordAction(userId: string, _prevState: ResetPasswordState, formData: FormData): Promise<ResetPasswordState> {
  const admin = await requireRole(["ADMIN"]);

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const passwordError = validatePassword(password, confirmPassword);
  if (passwordError) {
    return { error: passwordError };
  }

  const supabase = await createSupabaseServerClient();

  const { data: staff } = await supabase.from("users").select("auth_user_id, username, email").eq("id", userId).single();
  if (!staff) {
    return { error: "Staff not found." };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(staff.auth_user_id, { password });
  if (error) {
    return { error: error.message };
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "STAFF_PASSWORD_RESET",
    details: { userId, username: staff.username ?? staff.email },
  });

  return { success: true };
}

// Bound to (userId) and used directly as a plain <form action={...}>
// handler (return void — see the comment on transitionBookingStatus in
// lib/booking/actions.ts for why). Permanently removes both the Supabase
// Auth user and the profile row — there is no undo. Guarded so the last
// active Admin account can never be deleted, which would leave nobody
// able to manage the system.
export async function deleteUserAction(userId: string): Promise<void> {
  const admin = await requireRole(["ADMIN"]);
  const supabase = await createSupabaseServerClient();

  const { data: target } = await supabase
    .from("users")
    .select("auth_user_id, role, full_name, username, email")
    .eq("id", userId)
    .single();

  if (!target) {
    throw new Error("User not found.");
  }

  if (target.role === "ADMIN") {
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "ADMIN")
      .eq("is_active", true);

    if ((count ?? 0) <= 1) {
      throw new Error("Cannot delete the only active Admin account.");
    }
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { error: profileError } = await supabaseAdmin.from("users").delete().eq("id", userId);
  if (profileError) {
    throw new Error(profileError.message);
  }

  await supabaseAdmin.auth.admin.deleteUser(target.auth_user_id);

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: "USER_DELETED",
    details: { userId, fullName: target.full_name, role: target.role, loginId: target.username ?? target.email },
  });

  revalidatePath("/admin");
}

// Bound to (userId, isActive) and used directly as a plain <form
// action={...}> handler, so it must return void — see the comment on
// transitionBookingStatus in lib/booking/actions.ts for why.
export async function setStaffActiveAction(userId: string, isActive: boolean): Promise<void> {
  const admin = await requireRole(["ADMIN"]);
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("users").update({ is_active: isActive }).eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("activity_logs").insert({
    user_id: admin.id,
    action: isActive ? "STAFF_REACTIVATED" : "STAFF_DEACTIVATED",
    details: { userId },
  });

  revalidatePath("/admin");
}
