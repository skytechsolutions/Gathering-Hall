"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createBookingAction, type ActionState } from "@/lib/booking/actions";
import { CustomerSection } from "./customer-section";
import { HoldDatesPicker } from "./hold-dates-picker";

type Customer = { id: string; full_name: string; phone: string | null };

const inputClass = "w-full rounded-2xl border border-hairline px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink";
const labelClass = "mb-1 block text-sm font-semibold text-body";

export function BookingForm({ customers, isAdmin }: { customers: Customer[]; isAdmin: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"HOLD" | "CONFIRMED">("HOLD");
  const [maleWaiter, setMaleWaiter] = useState(false);
  const [femaleWaiter, setFemaleWaiter] = useState(false);

  async function action(_prevState: ActionState, formData: FormData): Promise<ActionState> {
    const result = await createBookingAction(_prevState, formData);
    if (result && "success" in result) {
      router.push("/bookings");
      router.refresh();
    }
    return result;
  }

  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="max-w-2xl space-y-6 rounded-2xl border border-hairline bg-canvas p-4 shadow-sm sm:rounded-[32px] sm:p-6">
      {isAdmin ? (
        <div>
          <label className={labelClass}>Type</label>
          <input type="hidden" name="status" value={mode} />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode("HOLD")}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${mode === "HOLD" ? "bg-ink text-white" : "bg-surface-card text-body hover:bg-secondary-bg"}`}
            >
              Hold
            </button>
            <button
              type="button"
              onClick={() => setMode("CONFIRMED")}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold ${mode === "CONFIRMED" ? "bg-ink text-white" : "bg-surface-card text-body hover:bg-secondary-bg"}`}
            >
              Confirmed
            </button>
          </div>
          <p className="mt-1.5 text-xs text-mute">
            {mode === "HOLD" ? "Just name, number, and date(s) — event details come later when confirming." : "Full details now — event type, guests, waiters, DJ, stage."}
          </p>
        </div>
      ) : (
        <input type="hidden" name="status" value="HOLD" />
      )}

      <CustomerSection customers={customers} />

      {mode === "HOLD" ? (
        <div>
          <label className={labelClass}>Date(s) to hold</label>
          <p className="mb-2 text-xs text-mute">You can hold up to 3 candidate dates while the customer decides. Event details are collected later, when confirming.</p>
          <HoldDatesPicker />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="eventType">Event Type</label>
              <select id="eventType" name="eventType" required className={inputClass} defaultValue="Barat">
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
              <input id="bookingDate" name="bookingDate" type="date" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="shift">Day / Night</label>
              <select id="shift" name="shift" required className={inputClass} defaultValue="NIGHT">
                <option value="DAY">Day</option>
                <option value="NIGHT">Night</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="guestCount">Guests</label>
              <input id="guestCount" name="guestCount" type="number" min={0} defaultValue={0} className={inputClass} />
            </div>
          </div>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <input id="maleWaiterRequired" name="maleWaiterRequired" type="checkbox" onChange={(event) => setMaleWaiter(event.target.checked)} />
              <label htmlFor="maleWaiterRequired" className="text-sm font-medium text-body">Male Waiter Required</label>
              {maleWaiter ? (
                <input name="maleWaiterQuantity" type="number" min={1} defaultValue={1} className="w-20 rounded-xl border border-hairline px-2 py-1.5 text-sm" />
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <input id="femaleWaiterRequired" name="femaleWaiterRequired" type="checkbox" onChange={(event) => setFemaleWaiter(event.target.checked)} />
              <label htmlFor="femaleWaiterRequired" className="text-sm font-medium text-body">Female Waiter Required</label>
              {femaleWaiter ? (
                <input name="femaleWaiterQuantity" type="number" min={1} defaultValue={1} className="w-20 rounded-xl border border-hairline px-2 py-1.5 text-sm" />
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <input id="djRequired" name="djRequired" type="checkbox" />
              <label htmlFor="djRequired" className="text-sm font-medium text-body">DJ Required</label>
            </div>
            <div className="flex items-center gap-3">
              <input id="stageRequired" name="stageRequired" type="checkbox" />
              <label htmlFor="stageRequired" className="text-sm font-medium text-body">Stage Required</label>
            </div>
          </fieldset>
        </>
      )}

      <div>
        <label className={labelClass} htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={3} className={inputClass} />
      </div>

      {state && "error" in state ? (
        <div className="rounded-2xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">{state.error}</div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-pressed disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : mode === "HOLD" ? "Hold Date(s)" : "Create Confirmed Booking"}
      </button>
    </form>
  );
}
