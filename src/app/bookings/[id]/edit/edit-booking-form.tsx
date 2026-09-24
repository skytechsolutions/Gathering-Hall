"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { updateBookingAction, type ActionState } from "@/lib/booking/actions";
import { CustomerCombobox } from "@/components/customer-combobox";

type Customer = { id: string; full_name: string; phone: string | null };

type Booking = {
  id: string;
  customer_id: string;
  booking_date: string;
  shift: string;
  event_type: string | null;
  status: string;
  guest_count: number;
  male_waiter_required: boolean;
  male_waiter_quantity: number;
  female_waiter_required: boolean;
  female_waiter_quantity: number;
  dj_required: boolean;
  stage_required: boolean;
  notes: string | null;
};

const inputClass = "w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink";
const labelClass = "mb-1 block text-sm font-semibold text-body";

export function EditBookingForm({ booking, customers }: { booking: Booking; customers: Customer[] }) {
  const router = useRouter();
  const [maleWaiter, setMaleWaiter] = useState(booking.male_waiter_required);
  const [femaleWaiter, setFemaleWaiter] = useState(booking.female_waiter_required);

  async function action(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    const result = await updateBookingAction(_prevState, formData);
    if (result && "success" in result) {
      router.push("/bookings");
      router.refresh();
    }
    return result;
  }

  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="max-w-2xl space-y-6 rounded-2xl border border-hairline bg-canvas p-4 shadow-sm sm:rounded-[32px] sm:p-6">
      <input type="hidden" name="bookingId" value={booking.id} />
      <input type="hidden" name="existingStatus" value={booking.status} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="customerId">Customer</label>
          <CustomerCombobox customers={customers} defaultCustomerId={booking.customer_id} />
        </div>
        <div>
          <label className={labelClass} htmlFor="eventType">Event Type {booking.status === "HOLD" ? <span className="font-normal text-mute">(optional until confirmed)</span> : null}</label>
          <select id="eventType" name="eventType" required={booking.status !== "HOLD"} className={inputClass} defaultValue={booking.event_type ?? ""}>
            <option value="">Not decided yet</option>
            <option value="Barat">Barat</option>
            <option value="Walima">Walima</option>
            <option value="Mehndi">Mehndi</option>
            <option value="Mayoun">Mayoun</option>
            <option value="Nikkah">Nikkah</option>
            <option value="Engagement">Engagement</option>
            <option value="Dholki">Dholki</option>
            <option value="Birthday">Birthday</option>
            <option value="Corporate Event">Corporate Event</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="bookingDate">Date</label>
          <input id="bookingDate" name="bookingDate" type="date" required defaultValue={booking.booking_date} className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="shift">Day / Night</label>
          <select id="shift" name="shift" required className={inputClass} defaultValue={booking.shift}>
            <option value="DAY">Day</option>
            <option value="NIGHT">Night</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="guestCount">Guests</label>
          <input id="guestCount" name="guestCount" type="number" min={0} defaultValue={booking.guest_count} className={inputClass} />
        </div>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <input id="maleWaiterRequired" name="maleWaiterRequired" type="checkbox" defaultChecked={booking.male_waiter_required} onChange={(event) => setMaleWaiter(event.target.checked)} />
          <label htmlFor="maleWaiterRequired" className="text-sm font-medium text-body">Male Waiter Required</label>
          {maleWaiter ? (
            <input name="maleWaiterQuantity" type="number" min={1} defaultValue={booking.male_waiter_quantity || 1} className="w-20 rounded-xl border border-hairline px-2 py-1.5 text-sm" />
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <input id="femaleWaiterRequired" name="femaleWaiterRequired" type="checkbox" defaultChecked={booking.female_waiter_required} onChange={(event) => setFemaleWaiter(event.target.checked)} />
          <label htmlFor="femaleWaiterRequired" className="text-sm font-medium text-body">Female Waiter Required</label>
          {femaleWaiter ? (
            <input name="femaleWaiterQuantity" type="number" min={1} defaultValue={booking.female_waiter_quantity || 1} className="w-20 rounded-xl border border-hairline px-2 py-1.5 text-sm" />
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <input id="djRequired" name="djRequired" type="checkbox" defaultChecked={booking.dj_required} />
          <label htmlFor="djRequired" className="text-sm font-medium text-body">DJ Required</label>
        </div>
        <div className="flex items-center gap-3">
          <input id="stageRequired" name="stageRequired" type="checkbox" defaultChecked={booking.stage_required} />
          <label htmlFor="stageRequired" className="text-sm font-medium text-body">Stage Required</label>
        </div>
      </fieldset>

      <div>
        <label className={labelClass} htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={booking.notes ?? ""} className={inputClass} />
      </div>

      {state && "error" in state ? (
        <div className="rounded-2xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">{state.error}</div>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-pressed disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/bookings")}
          className="rounded-2xl bg-secondary-bg px-5 py-2.5 text-sm font-bold text-ink hover:bg-secondary-pressed"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
