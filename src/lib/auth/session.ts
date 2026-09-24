import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppRole, CurrentUser, isAdmin, isStaff } from "@/lib/auth/permissions";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, username, full_name, role, is_active")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    return null;
  }

  return {
    id: String(profile.id),
    email: String(profile.email),
    username: profile.username ? String(profile.username) : null,
    fullName: String(profile.full_name),
    role: profile.role as AppRole,
  };
}

export async function requireRole(allowedRoles: AppRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error("You do not have permission to access this resource.");
  }

  return user;
}

export function canAccessDashboard(role?: AppRole | null) {
  return isAdmin(role) || isStaff(role);
}
