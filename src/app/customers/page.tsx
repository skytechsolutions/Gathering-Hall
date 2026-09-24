import { requireRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomerForm } from "./customer-form";

export default async function CustomersPage() {
  await requireRole(["ADMIN", "STAFF"]);
  const supabase = await createSupabaseServerClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, phone, whatsapp_number, address, reference_name, reference_phone")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Customers</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">Customers</h1>
      </div>

      <CustomerForm />

      <div className="overflow-hidden rounded-[32px] border border-hairline bg-canvas shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-card text-body">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Name</th>
                <th className="px-5 py-3.5 font-semibold">Phone</th>
                <th className="px-5 py-3.5 font-semibold">WhatsApp</th>
                <th className="px-5 py-3.5 font-semibold">Address</th>
                <th className="px-5 py-3.5 font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              {(customers ?? []).map((customer) => (
                <tr key={customer.id} className="border-t border-hairline-soft transition hover:bg-surface-soft">
                  <td className="px-5 py-4 font-semibold text-ink">{customer.full_name}</td>
                  <td className="px-5 py-4 text-body">{customer.phone}</td>
                  <td className="px-5 py-4 text-body">{customer.whatsapp_number}</td>
                  <td className="px-5 py-4 text-body">{customer.address}</td>
                  <td className="px-5 py-4 text-body">
                    {customer.reference_name ? (
                      <>
                        <p>{customer.reference_name}</p>
                        <p className="text-xs text-mute">{customer.reference_phone}</p>
                      </>
                    ) : (
                      <span className="text-mute">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {(customers ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-mute">No customers yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
