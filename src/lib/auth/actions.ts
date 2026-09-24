"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { usernameToStaffEmail, validatePassword } from "@/lib/auth/password";

export type SignInState = { error: string } | null;

export async function signInAction(_prevState: SignInState, formData: FormData): Promise<SignInState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/dashboard");

  if (!identifier || !password) {
    return { error: "Email/username and password are required." };
  }

  // Admin signs in with their real email; Staff sign in with a username,
  // which resolves deterministically to the synthetic email that was used
  // to create their account — no database lookup needed before auth.
  const email = identifier.includes("@") ? identifier : usernameToStaffEmail(identifier);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Invalid email/username or password." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_active")
    .eq("auth_user_id", data.user.id)
    .single();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "This account is not active. Contact your admin." };
  }

  redirect(redirectTo || "/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ForgotPasswordState = { message: string } | { error: string } | null;

// Admin-only in practice: Staff have no real email (they log in with a
// username), so this only ever does anything useful for an Admin address.
// Always returns the same generic message either way — never confirms or
// denies whether an account exists for the given email.
export async function forgotPasswordAction(_prevState: ForgotPasswordState, formData: FormData): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  return { message: "If that email has an account, a reset link has been sent — check your inbox." };
}

export type UpdatePasswordState = { error: string } | { success: true } | null;

// Used by /reset-password (after the recovery link exchange has already
// established a temporary session) and available for a signed-in user to
// change their own password from the Account page.
export async function updatePasswordAction(_prevState: UpdatePasswordState, formData: FormData): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const passwordError = validatePassword(password, confirmPassword);
  if (passwordError) {
    return { error: passwordError };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session has expired. Request a new reset link." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export type ChangePasswordState = { error: string } | { success: true } | null;

// For a signed-in user changing their own password from the Account page
// (old + new), as opposed to /reset-password (which only runs after a
// recovery-link session, no old password known). Re-authenticating with
// the old password first proves they're not using a session left open on
// someone else's screen.
export async function changeOwnPasswordAction(_prevState: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const oldPassword = String(formData.get("oldPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!oldPassword) {
    return { error: "Enter your current password." };
  }
  const passwordError = validatePassword(newPassword, confirmPassword);
  if (passwordError) {
    return { error: passwordError };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Your session has expired. Sign in again." };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({ email: user.email, password: oldPassword });
  if (reauthError) {
    return { error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
