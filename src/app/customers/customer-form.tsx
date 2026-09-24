"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createCustomerAction, type ActionState } from "@/lib/customers/actions";

const inputClass = "w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink";
const labelClass = "mb-1 block text-sm font-semibold text-body";

export function CustomerForm() {
  const router = useRouter();

  async function action(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    const result = await createCustomerAction(_prevState, formData);
    if (result && "success" in result) {
      router.refresh();
    }
    return result;
  }

  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-hairline bg-canvas p-4 shadow-sm sm:grid-cols-2 sm:rounded-[32px] sm:p-6">
      <div>
        <label className={labelClass} htmlFor="fullName">Full Name</label>
        <input id="fullName" name="fullName" required className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="phone">Phone</label>
        <input id="phone" name="phone" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="whatsappNumber">WhatsApp Number</label>
        <input id="whatsappNumber" name="whatsappNumber" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="address">Address</label>
        <input id="address" name="address" className={inputClass} />
      </div>
      <div>
        <label className={labelClass} htmlFor="referenceName">Reference Name</label>
        <input id="referenceName" name="referenceName" className={inputClass} placeholder="Who referred this customer" />
      </div>
      <div>
        <label className={labelClass} htmlFor="referencePhone">Reference Phone</label>
        <input id="referencePhone" name="referencePhone" className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={2} className={inputClass} />
      </div>

      {state && "error" in state ? (
        <div className="sm:col-span-2 rounded-2xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">{state.error}</div>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-pressed disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Saving..." : "Add Customer"}
        </button>
      </div>
    </form>
  );
}
