import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { setStaffActiveAction } from "@/lib/admin/actions";
import { UserForm } from "./user-form";
import { ResetPasswordButton } from "./reset-password-button";
import { DeleteUserButton } from "./delete-user-button";

export default async function AdminPage() {
  await requireRole(["ADMIN"]);
  const supabase = await createSupabaseServerClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, username, phone, role, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Staff management</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Manager Controls</h1>
        <p className="mt-1 text-sm text-mute">There is no public sign-up. Create Admin or Staff accounts here.</p>
      </div>

      <UserForm />

      <div className="overflow-hidden rounded-[32px] border border-hairline bg-canvas shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-card text-body">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Name</th>
                <th className="px-5 py-3.5 font-semibold">Login</th>
                <th className="px-5 py-3.5 font-semibold">Role</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((staff) => (
                <tr key={staff.id} className="border-t border-hairline-soft align-top transition hover:bg-surface-soft">
                  <td className="px-5 py-4 font-semibold text-ink">{staff.full_name}</td>
                  <td className="px-5 py-4 text-body">{staff.role === "ADMIN" ? staff.email : staff.username}</td>
                  <td className="px-5 py-4 text-body">{staff.role}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${staff.is_active ? "bg-success-pale text-success-deep" : "bg-secondary-bg text-body"}`}>
                      {staff.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-start gap-2">
                      {staff.role === "STAFF" ? (
                        <>
                          <form action={setStaffActiveAction.bind(null, staff.id, !staff.is_active)}>
                            <button className="rounded-lg border border-hairline px-2 py-1 text-xs font-medium text-body hover:bg-surface-card">
                              {staff.is_active ? "Deactivate" : "Reactivate"}
                            </button>
                          </form>
                          <ResetPasswordButton userId={staff.id} />
                        </>
                      ) : null}
                      <DeleteUserButton userId={staff.id} label={staff.full_name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
